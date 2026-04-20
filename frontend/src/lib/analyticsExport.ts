import type { LeaderboardEntry, PositionGroup, LeaderboardMetric } from "@/types";
import type { ColDef } from "./analyticsConfig";
import { formatCell } from "./analyticsConfig";

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildHeaders(cols: ColDef[]): string[] {
  return ["#", "Jugador", "Pos", "Club", "Nacionalidad", ...cols.map((c) => c.label)];
}

function buildRows(entries: LeaderboardEntry[], cols: ColDef[]): (string | number)[][] {
  return entries.map((e) => [
    e.rank,
    e.name,
    e.position,
    e.teamName ?? "—",
    e.nationality ?? "—",
    ...cols.map((c) => {
      const raw = e[c.key as keyof LeaderboardEntry] as number | undefined;
      return formatCell(raw, c.format);
    }),
  ]);
}

function slugify(s: string) {
  return s.replace(/[^a-z0-9]/gi, "_");
}

// ── Excel export (SheetJS) ────────────────────────────────────────────────────

export async function exportToExcel(
  entries: LeaderboardEntry[],
  cols: ColDef[],
  group: PositionGroup,
  metric: LeaderboardMetric,
  seasonName: string,
): Promise<void> {
  const XLSX    = await import("xlsx");
  const headers = buildHeaders(cols);
  const rows    = buildRows(entries, cols);
  const ws      = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  ws["!cols"] = headers.map((h, i) => ({
    wch: Math.max(h.length, ...rows.map((r) => String(r[i] ?? "").length)) + 2,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reportes LDP");

  const date     = new Date().toISOString().slice(0, 10);
  const filename = `LDP_Reportes_${slugify(group)}_${slugify(metric)}_${slugify(seasonName)}_${date}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ── PDF export (jsPDF + autotable) ────────────────────────────────────────────
// Sequential import: autotable must be loaded after jspdf so it can extend its prototype.

export async function exportToPDF(
  entries: LeaderboardEntry[],
  cols: ColDef[],
  group: PositionGroup,
  metric: LeaderboardMetric,
  seasonName: string,
): Promise<void> {
  // Load jspdf first, then autotable (order matters for prototype patching)
  const { default: jsPDF }     = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const PAGE_W = 297;
  const ACCENT: [number, number, number] = [0, 180, 120]; // LDP green — readable on white

  // ── Header strip ──────────────────────────────────────────────────────────
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, PAGE_W, 16, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("LDP Scout Panel — Reportes de Liga", 10, 10);

  // ── Sub-header ────────────────────────────────────────────────────────────
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 16, PAGE_W, 10, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const metaLabel = cols.find((c) => c.key === metric)?.label ?? metric;
  doc.text(
    `Temporada: ${seasonName}   ·   Grupo: ${group}   ·   Ordenado por: ${metaLabel}   ·   ${entries.length} jugadores`,
    10,
    22,
  );

  // ── Table ─────────────────────────────────────────────────────────────────
  const headers = buildHeaders(cols);
  const rows    = buildRows(entries, cols);

  autoTable(doc, {
    head: [headers],
    body: rows as string[][],
    startY: 28,
    margin: { left: 8, right: 8 },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: { top: 3, right: 5, bottom: 3, left: 5 },
      textColor: [40, 40, 40],
      lineColor: [220, 220, 220],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: ACCENT,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 }, // #
      1: { cellWidth: 45 },                   // Jugador
      2: { halign: "center", cellWidth: 14 }, // Pos
    },
    didDrawPage: (data: any) => {
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `LDP Scout Panel · Exportado el ${new Date().toLocaleDateString("es-AR")} · Pág. ${data.pageNumber ?? ""}`,
        PAGE_W / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: "center" },
      );
    },
  });

  const date     = new Date().toISOString().slice(0, 10);
  const filename = `LDP_Reportes_${slugify(group)}_${slugify(metric)}_${slugify(seasonName)}_${date}.pdf`;
  doc.save(filename);
}
