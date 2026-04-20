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

// ── Brand palette (sincronizado con globals.css) ──────────────────────────────
const C = {
  bg:        [15,  15,  15]  as [number,number,number], // --main-bg  #0F0F0F
  card:      [28,  28,  28]  as [number,number,number], // --card     #1C1C1C
  cardAlt:   [22,  22,  22]  as [number,number,number], // fila alternada
  border:    [44,  44,  44]  as [number,number,number], // --border   #2C2C2C
  primary:   [242, 242, 242] as [number,number,number], // --primary  #F2F2F2
  secondary: [200, 200, 200] as [number,number,number], // --secondary #C8C8C8
  muted:     [149, 149, 149] as [number,number,number], // --muted    #959595
  green:     [0,   224, 148] as [number,number,number], // --green    #00E094
  greenDark: [0,   160, 106] as [number,number,number], // green oscuro para texto sobre fondo claro
};

export async function exportToPDF(
  entries: LeaderboardEntry[],
  cols: ColDef[],
  group: PositionGroup,
  metric: LeaderboardMetric,
  seasonName: string,
): Promise<void> {
  const { default: jsPDF }     = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc    = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const PAGE_W = 297;
  const PAGE_H = 210;

  // ── Fondo oscuro completo ──────────────────────────────────────────────────
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  // ── Header strip — card oscuro con borde verde inferior ───────────────────
  doc.setFillColor(...C.card);
  doc.rect(0, 0, PAGE_W, 18, "F");

  // Línea acento verde
  doc.setFillColor(...C.green);
  doc.rect(0, 18, PAGE_W, 0.6, "F");

  // Punto decorativo verde a la izquierda
  doc.setFillColor(...C.green);
  doc.circle(8, 9, 2.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...C.primary);
  doc.text("ScoutPanel", 14, 9.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.green);
  doc.text("LDP · Liga Profesional Argentina", 14, 14.5);

  // Fecha alineada a la derecha
  doc.setTextColor(...C.muted);
  doc.setFontSize(7);
  doc.text(
    `Exportado: ${new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}`,
    PAGE_W - 8,
    9.5,
    { align: "right" },
  );

  // ── Sub-header — metadata del reporte ────────────────────────────────────
  doc.setFillColor(...C.cardAlt);
  doc.rect(0, 18.6, PAGE_W, 11, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.secondary);

  const metaLabel = cols.find((c) => c.key === metric)?.label ?? metric;
  const metaParts = [
    `Temporada: ${seasonName}`,
    `Grupo: ${group}`,
    `Ordenado por: ${metaLabel}`,
    `${entries.length} jugadores`,
  ];
  doc.text(metaParts.join("   ·   "), 8, 25.5);

  // ── Tabla ─────────────────────────────────────────────────────────────────
  const headers = buildHeaders(cols);
  const rows    = buildRows(entries, cols);

  const footerText = `ScoutPanel LDP · Reporte generado el ${new Date().toLocaleDateString("es-AR")}`;

  autoTable(doc, {
    head: [headers],
    body: rows as string[][],
    startY: 31,
    margin: { left: 8, right: 8, bottom: 12 },
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: { top: 3, right: 5, bottom: 3, left: 5 },
      textColor: C.secondary,
      fillColor: C.card,
      lineColor: C.border,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [20, 20, 20],
      textColor: C.green,
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
      lineColor: C.border,
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: C.cardAlt,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10, textColor: C.muted },
      1: { cellWidth: 46, textColor: C.primary, fontStyle: "bold" },
      2: { halign: "center", cellWidth: 14 },
    },
    // willDrawPage se ejecuta ANTES del contenido → el fondo no tapa la tabla
    willDrawPage: (data: any) => {
      // Fondo oscuro completo
      doc.setFillColor(...C.bg);
      doc.rect(0, 0, PAGE_W, PAGE_H, "F");

      // Header en páginas 2+
      if (data.pageNumber > 1) {
        doc.setFillColor(...C.card);
        doc.rect(0, 0, PAGE_W, 10, "F");
        doc.setFillColor(...C.green);
        doc.rect(0, 10, PAGE_W, 0.4, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...C.primary);
        doc.text("ScoutPanel LDP", 8, 6.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.muted);
        doc.setFontSize(7);
        doc.text(`${seasonName}  ·  ${group}  ·  pág. ${data.pageNumber}`, PAGE_W - 8, 6.5, { align: "right" });
      }
    },
    didDrawPage: (data: any) => {
      // Footer
      doc.setFillColor(...C.card);
      doc.rect(0, PAGE_H - 9, PAGE_W, 9, "F");
      doc.setFillColor(...C.green);
      doc.rect(0, PAGE_H - 9, PAGE_W, 0.4, "F");
      doc.setFontSize(6.5);
      doc.setTextColor(...C.muted);
      doc.text(
        `${footerText} · Página ${data.pageNumber}`,
        PAGE_W / 2,
        PAGE_H - 3.5,
        { align: "center" },
      );
    },
  });

  const date     = new Date().toISOString().slice(0, 10);
  const filename = `LDP_Reportes_${slugify(group)}_${slugify(metric)}_${slugify(seasonName)}_${date}.pdf`;
  doc.save(filename);
}
