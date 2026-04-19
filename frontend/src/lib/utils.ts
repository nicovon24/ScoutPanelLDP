// ─── Shared utility functions ─────────────────────────────────────────────────

/**
 * Calcula la edad en años a partir de una fecha de nacimiento ISO.
 * Retorna null (no NaN) si la fecha es inválida o no existe.
 */
export function calcAge(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

/** Versión string: retorna "X años" o "—" */
export function calcAgeStr(dob?: string | null): string {
  const age = calcAge(dob);
  return age !== null ? `${age} años` : "—";
}

/** Clase CSS de posición */
export function posStyle(pos?: string): string {
  const p = (pos ?? "").toUpperCase();
  if (["CF", "SS", "LW", "RW"].includes(p)) return "pos-attack";
  if (["CAM", "CM", "CDM"].includes(p)) return "pos-mid";
  if (["CB", "LB", "RB"].includes(p)) return "pos-def";
  return "pos-gk";
}

/** Formatea un número o string numérico; devuelve "—" si es nulo/NaN */
export function fmt(v: string | number | undefined | null, decimals = 0): string {
  if (v == null || v === "") return "—";
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return "—";
  return decimals > 0 ? n.toFixed(decimals) : String(n);
}

/** Formatea como porcentaje con 1 decimal, o "—" */
export function fmtPct(v: string | number | undefined | null): string {
  const s = fmt(v, 1);
  return s === "—" ? "—" : `${s}%`;
}

/** Tipo de contrato en español */
export function contractTypeLabel(t?: string | null): string {
  if (t === "LOAN") return "Préstamo";
  if (t === "FREE") return "Libre";
  if (t === "PERMANENT") return "Definitivo";
  return t ?? "—";
}

/** Parsea el año inicial de un rango como "2023-2024" → 2023 */
export function careerYearKey(yearRange: string): number {
  const m = yearRange.match(/^(\d{4})/);
  return m ? parseInt(m[1], 10) : 0;
}
