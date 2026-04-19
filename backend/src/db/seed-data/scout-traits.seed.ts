// ─── Fortalezas y debilidades por posición ────────────────────────────────────
export const STRENGTH_BY_POS: Record<string, string[]> = {
  GK:  ["Reflejos", "Juego aéreo", "Salidas", "Uno contra uno", "Distribución larga"],
  CB:  ["Juego aéreo", "Entradas", "Salida de balón", "Fuerza", "Posicionamiento"],
  LB:  ["Progresión", "Centros", "Resistencia", "1c1 defensivo", "Apoyos al ataque"],
  RB:  ["Progresión", "Centros", "Resistencia", "1c1 defensivo", "Apoyos al ataque"],
  CDM: ["Corte", "Distribución", "Visión", "Duelos", "Coberturas"],
  CM:  ["Pase", "Visión", "Duelos", "Resistencia", "Llegada al área"],
  CAM: ["Pase final", "Regate", "Visión", "Tiros de media", "Asociación"],
  SS:  ["Movilidad", "Remate", "Asociación", "Regate", "Desmarques"],
  CF:  ["Definición", "Juego de espaldas", "Remate", "Potencia", "Juego aéreo"],
  LW:  ["Velocidad", "Regate", "Centros", "1c1", "Desmarque"],
  RW:  ["Velocidad", "Regate", "Centros", "1c1", "Desmarque"],
};

export const WEAK_BY_POS: Record<string, string[]> = {
  GK:  ["Juego con los pies", "Salidas al cruce", "Distancia largos", "Concentración"],
  CB:  ["Velocidad", "Juego con los pies", "Agilidad", "Disciplina"],
  LB:  ["Juego aéreo", "Centros defensivos", "Disciplina", "Finalización"],
  RB:  ["Juego aéreo", "Centros defensivos", "Disciplina", "Finalización"],
  CDM: ["Llegada al área", "Remate", "Velocidad punta", "Creatividad"],
  CM:  ["Marca alta", "Juego aéreo", "Disciplina", "Finalización"],
  CAM: ["Duelos físicos", "Marca", "Resistencia", "Defensa"],
  SS:  ["Duelos aéreos", "Marca", "Centros", "Disciplina"],
  CF:  ["Presión", "Asistencias", "Carreras defensivas", "Disciplina"],
  LW:  ["Juego aéreo", "Defensa", "Centros medidos", "Disciplina"],
  RW:  ["Juego aéreo", "Defensa", "Centros medidos", "Disciplina"],
};

// ─── Zonas de calor por posición (grilla 5×5, 0–100) ─────────────────────────
// fila 0 = campo rival, fila 4 = arco propio (convención heatmap estándar)
type HeatZone = { row: [number, number]; col: [number, number]; lo: number; hi: number };

export const HEATMAP_ZONES: Record<string, HeatZone[]> = {
  GK: [
    { row: [3, 4], col: [1, 3], lo: 55, hi: 95 },
    { row: [0, 4], col: [0, 4], lo: 5,  hi: 28 },
  ],
  CB: [
    { row: [2, 4], col: [0, 4], lo: 32, hi: 78 },
    { row: [0, 1], col: [0, 4], lo: 8,  hi: 38 },
  ],
  LB: [
    { row: [2, 4], col: [0, 4], lo: 32, hi: 78 },
    { row: [0, 1], col: [0, 4], lo: 8,  hi: 38 },
  ],
  RB: [
    { row: [2, 4], col: [0, 4], lo: 32, hi: 78 },
    { row: [0, 1], col: [0, 4], lo: 8,  hi: 38 },
  ],
  CDM: [
    { row: [1, 3], col: [0, 4], lo: 28, hi: 72 },
    { row: [0, 0], col: [0, 4], lo: 10, hi: 42 },
    { row: [4, 4], col: [0, 4], lo: 10, hi: 42 },
  ],
  CM: [
    { row: [1, 3], col: [0, 4], lo: 28, hi: 72 },
    { row: [0, 0], col: [0, 4], lo: 10, hi: 42 },
    { row: [4, 4], col: [0, 4], lo: 10, hi: 42 },
  ],
  CAM: [
    { row: [0, 2], col: [1, 3], lo: 38, hi: 88 },
    { row: [0, 4], col: [0, 4], lo: 10, hi: 40 },
  ],
  SS: [
    { row: [0, 2], col: [1, 3], lo: 38, hi: 88 },
    { row: [0, 4], col: [0, 4], lo: 10, hi: 40 },
  ],
  CF: [
    { row: [0, 2], col: [0, 4], lo: 32, hi: 92 },
    { row: [3, 4], col: [0, 4], lo: 10, hi: 42 },
  ],
  LW: [
    { row: [0, 2], col: [0, 4], lo: 32, hi: 92 },
    { row: [3, 4], col: [0, 4], lo: 10, hi: 42 },
  ],
  RW: [
    { row: [0, 2], col: [0, 4], lo: 32, hi: 92 },
    { row: [3, 4], col: [0, 4], lo: 10, hi: 42 },
  ],
};

// ─── Distribución de tipos de contrato ───────────────────────────────────────
// Cada grupo de 12 jugadores (por índice) tiene: 1 libre, 2 préstamo, 9 permanentes
// La distribución se repite cada 12 jugadores
export type ContractKind = "PERMANENT" | "LOAN" | "FREE";

export const CONTRACT_DISTRIBUTION: Array<{ type: ContractKind; yearsRange: [number, number] }> = [
  { type: "FREE",      yearsRange: [0, 0] },   // idx % 12 === 0
  { type: "LOAN",      yearsRange: [0, 0] },   // idx % 12 === 1
  { type: "LOAN",      yearsRange: [0, 0] },   // idx % 12 === 2
  { type: "PERMANENT", yearsRange: [0, 1] },
  { type: "PERMANENT", yearsRange: [1, 2] },
  { type: "PERMANENT", yearsRange: [1, 3] },
  { type: "PERMANENT", yearsRange: [2, 3] },
  { type: "PERMANENT", yearsRange: [2, 4] },
  { type: "PERMANENT", yearsRange: [3, 4] },
  { type: "PERMANENT", yearsRange: [1, 2] },
  { type: "PERMANENT", yearsRange: [0, 1] },
  { type: "PERMANENT", yearsRange: [2, 3] },
];
