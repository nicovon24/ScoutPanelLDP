import { describe, it, expect } from "vitest";
import { calcAge, calcAgeStr, posStyle, fmt, fmtPct, contractTypeLabel } from "@/lib/utils";

// ── calcAge ───────────────────────────────────────────────────────────────────

describe("calcAge", () => {
  it("devuelve null para valores nulos/undefined", () => {
    expect(calcAge(null)).toBeNull();
    expect(calcAge(undefined)).toBeNull();
  });

  it("devuelve null para fecha inválida", () => {
    expect(calcAge("no-es-fecha")).toBeNull();
  });

  it("devuelve un número positivo para fecha válida", () => {
    const age = calcAge("2000-01-01");
    expect(typeof age).toBe("number");
    expect(age).toBeGreaterThan(0);
  });

  it("jugador nacido hoy tiene 0 años", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(calcAge(today)).toBe(0);
  });
});

// ── posStyle ─────────────────────────────────────────────────────────────────

describe("posStyle", () => {
  it("GK → pos-gk", () => {
    expect(posStyle("GK")).toBe("pos-gk");
  });

  it("CF → pos-attack", () => {
    expect(posStyle("CF")).toBe("pos-attack");
  });

  it("CM → pos-mid", () => {
    expect(posStyle("CM")).toBe("pos-mid");
  });

  it("CB → pos-def", () => {
    expect(posStyle("CB")).toBe("pos-def");
  });

  it("LW y RW también son pos-attack", () => {
    expect(posStyle("LW")).toBe("pos-attack");
    expect(posStyle("RW")).toBe("pos-attack");
  });

  it("posición desconocida no lanza error (fallback gk)", () => {
    expect(() => posStyle("XX")).not.toThrow();
    expect(typeof posStyle("XX")).toBe("string");
  });

  it("acepta lowercase", () => {
    expect(posStyle("cf")).toBe("pos-attack");
    expect(posStyle("gk")).toBe("pos-gk");
  });
});

// ── fmt ───────────────────────────────────────────────────────────────────────

describe("fmt", () => {
  it("devuelve '—' para null", () => {
    expect(fmt(null)).toBe("—");
  });

  it("devuelve '—' para undefined", () => {
    expect(fmt(undefined)).toBe("—");
  });

  it("devuelve '—' para string vacío", () => {
    expect(fmt("")).toBe("—");
  });

  it("formatea entero correctamente", () => {
    expect(fmt(10)).toBe("10");
  });

  it("formatea con decimales", () => {
    expect(fmt(3.14159, 2)).toBe("3.14");
  });

  it("devuelve '0' para el número 0", () => {
    expect(fmt(0)).toBe("0");
  });

  it("parsea strings numéricos", () => {
    expect(fmt("7.5", 1)).toBe("7.5");
  });
});

// ── fmtPct ────────────────────────────────────────────────────────────────────

describe("fmtPct", () => {
  it("agrega '%' al valor", () => {
    expect(fmtPct(75.5)).toBe("75.5%");
  });

  it("devuelve '—' para null", () => {
    expect(fmtPct(null)).toBe("—");
  });

  it("devuelve '—' para undefined", () => {
    expect(fmtPct(undefined)).toBe("—");
  });
});

// ── contractTypeLabel ─────────────────────────────────────────────────────────

describe("contractTypeLabel", () => {
  it("LOAN → 'Préstamo'", () => {
    expect(contractTypeLabel("LOAN")).toBe("Préstamo");
  });

  it("FREE → 'Libre'", () => {
    expect(contractTypeLabel("FREE")).toBe("Libre");
  });

  it("PERMANENT → 'Definitivo'", () => {
    expect(contractTypeLabel("PERMANENT")).toBe("Definitivo");
  });

  it("null → '—'", () => {
    expect(contractTypeLabel(null)).toBe("—");
  });

  it("valor desconocido se retorna tal cual", () => {
    expect(contractTypeLabel("OTRO")).toBe("OTRO");
  });
});
