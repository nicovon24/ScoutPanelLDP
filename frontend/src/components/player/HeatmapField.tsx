"use client";
import { useEffect, useRef } from "react";

const DEFAULT_W = 880;
const DEFAULT_H = 480;

export interface HeatmapFieldProps {
  grid: number[][] | null | undefined;
  /** Ancho lógico del canvas (px). Por defecto ~880 para vista detalle. */
  width?: number;
  /** Alto lógico del canvas (px). */
  height?: number;
  className?: string;
}

export default function HeatmapField({
  grid,
  width = DEFAULT_W,
  height = DEFAULT_H,
  className = "",
}: HeatmapFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = width;
    const H = height;
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const PX = Math.round(W * 0.054);
    const PY = Math.round(H * 0.042);
    const FW = W - 2 * PX;
    const FH = H - 2 * PY;

    ctx.clearRect(0, 0, W, H);

    const STRIPE_COUNT = 10;
    for (let i = 0; i < STRIPE_COUNT; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#346d32" : "#3d7c3b";
      ctx.fillRect(PX + (i * FW) / STRIPE_COUNT, PY, FW / STRIPE_COUNT, FH);
    }

    if (grid && grid.length === 5 && grid[0]?.length === 5) {
      const off = document.createElement("canvas");
      off.width = W * dpr;
      off.height = H * dpr;
      const oc = off.getContext("2d")!;
      oc.scale(dpr, dpr);

      const cellW = FW / 5;
      const cellH = FH / 5;
      const blobR = Math.max(cellW, cellH) * 1.38;

      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          const val = grid[row]?.[col] ?? 0;
          const t = Math.min(1, val / 100);
          if (t < 0.07) continue;

          const bx = PX + (4 - row + 0.5) * cellW;
          const by = PY + (col + 0.5) * cellH;

          const g = oc.createRadialGradient(bx, by, 0, bx, by, blobR);

          let c0: string, c1: string, c2: string;
          if (t > 0.75) {
            c0 = `rgba(255,30,10,${(t * 0.88).toFixed(2)})`;
            c1 = `rgba(255,120,0,${(t * 0.52).toFixed(2)})`;
            c2 = `rgba(255,210,40,${(t * 0.18).toFixed(2)})`;
          } else if (t > 0.50) {
            c0 = `rgba(255,110,0,${(t * 0.82).toFixed(2)})`;
            c1 = `rgba(255,205,50,${(t * 0.45).toFixed(2)})`;
            c2 = `rgba(210,235,60,${(t * 0.16).toFixed(2)})`;
          } else if (t > 0.30) {
            c0 = `rgba(255,220,70,${(t * 0.76).toFixed(2)})`;
            c1 = `rgba(190,235,80,${(t * 0.32).toFixed(2)})`;
            c2 = `rgba(90,210,70,${(t * 0.10).toFixed(2)})`;
          } else {
            c0 = `rgba(170,235,80,${(t * 0.62).toFixed(2)})`;
            c1 = `rgba(95,205,75,${(t * 0.20).toFixed(2)})`;
            c2 = "rgba(0,0,0,0)";
          }

          g.addColorStop(0, c0);
          g.addColorStop(0.42, c1);
          g.addColorStop(0.75, c2);
          g.addColorStop(1, "rgba(0,0,0,0)");

          oc.fillStyle = g;
          oc.fillRect(0, 0, W, H);
        }
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(PX, PY, FW, FH);
      ctx.clip();
      ctx.drawImage(off, 0, 0, W * dpr, H * dpr, 0, 0, W, H);
      ctx.restore();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.72)";
    ctx.lineWidth = Math.max(1, W / 420);
    ctx.lineJoin = "round";

    ctx.strokeRect(PX, PY, FW, FH);

    ctx.beginPath();
    ctx.moveTo(PX + FW / 2, PY);
    ctx.lineTo(PX + FW / 2, PY + FH);
    ctx.stroke();

    const cr = Math.min(FW, FH) * 0.13;
    ctx.beginPath();
    ctx.arc(PX + FW / 2, PY + FH / 2, cr, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.beginPath();
    ctx.arc(PX + FW / 2, PY + FH / 2, Math.max(2, W / 210), 0, Math.PI * 2);
    ctx.fill();

    const paW = FW * 0.15;
    const paH = FH * 0.44;
    ctx.strokeRect(PX, PY + (FH - paH) / 2, paW, paH);
    ctx.strokeRect(PX + FW - paW, PY + (FH - paH) / 2, paW, paH);

    const gaW = FW * 0.055;
    const gaH = FH * 0.22;
    ctx.strokeRect(PX, PY + (FH - gaH) / 2, gaW, gaH);
    ctx.strokeRect(PX + FW - gaW, PY + (FH - gaH) / 2, gaW, gaH);

    const goalH = FH * 0.125;
    const goalD = Math.max(6, W * 0.015);
    ctx.strokeRect(PX - goalD, PY + (FH - goalH) / 2, goalD, goalH);
    ctx.strokeRect(PX + FW, PY + (FH - goalH) / 2, goalD, goalH);

    ctx.fillStyle = "rgba(255,255,255,0.78)";
    for (const sx of [PX + paW * 0.68, PX + FW - paW * 0.68]) {
      ctx.beginPath();
      ctx.arc(sx, PY + FH / 2, Math.max(1.5, W / 280), 0, Math.PI * 2);
      ctx.fill();
    }

    const spotOffsetL = PX + paW * 0.68;
    const spotOffsetR = PX + FW - paW * 0.68;
    const dR = cr * 0.82;

    ctx.save();
    ctx.beginPath();
    ctx.rect(PX + paW, PY, FW, FH);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(spotOffsetL, PY + FH / 2, dR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(PX, PY, FW - paW, FH);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(spotOffsetR, PY + FH / 2, dR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const corrR = Math.max(5, W * 0.012);
    const corners: [number, number, number, number][] = [
      [PX, PY, 0, Math.PI / 2],
      [PX + FW, PY, Math.PI / 2, Math.PI],
      [PX + FW, PY + FH, Math.PI, (3 * Math.PI) / 2],
      [PX, PY + FH, (3 * Math.PI) / 2, 2 * Math.PI],
    ];
    for (const [cx, cy, sa, ea] of corners) {
      ctx.beginPath();
      ctx.arc(cx, cy, corrR, sa, ea);
      ctx.stroke();
    }
  }, [grid, width, height]);

  const hasGrid = grid && grid.length === 5 && (grid[0]?.length ?? 0) === 5;

  if (!hasGrid) {
    return (
      <div
        className={`rounded-xl border border-border/50 bg-white/[0.02] px-4 py-10 text-center ${className}`}
      >
        <p className="text-base text-muted">Sin mapa de calor para esta temporada.</p>
        <p className="mt-2 text-sm text-secondary">Elegí otra temporada o volvé a cargar los datos.</p>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border border-border/60 bg-gradient-to-b from-white/[0.04] to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${className}`}
    >
      <div className="p-2 sm:p-4">
        <div
          className="mx-auto overflow-hidden rounded-lg shadow-[0_16px_48px_rgba(0,0,0,0.38)] ring-1 ring-black/45"
          style={{ maxWidth: width }}
        >
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="block h-auto w-full"
            role="img"
            aria-label="Mapa de calor del jugador sobre el campo"
          />
        </div>
      </div>
    </div>
  );
}
