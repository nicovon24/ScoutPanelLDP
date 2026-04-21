import { describe, it, expect } from "vitest";
import { formatCell } from "@/lib/analyticsConfig";

describe("formatCell", () => {
  it("devuelve '—' para undefined", () => {
    expect(formatCell(undefined, "int")).toBe("—");
  });

  it("devuelve '—' para null", () => {
    expect(formatCell(null, "int")).toBe("—");
  });

  it("devuelve '—' para NaN", () => {
    expect(formatCell(NaN, "int")).toBe("—");
  });

  it("formatea entero sin decimales (int)", () => {
    expect(formatCell(10, "int")).toBe("10");
  });

  it("redondea al entero más cercano (int)", () => {
    expect(formatCell(9.7, "int")).toBe("10");
    expect(formatCell(9.2, "int")).toBe("9");
  });

  it("formatea 0 correctamente", () => {
    expect(formatCell(0, "int")).toBe("0");
  });

  it("formatea porcentaje con 1 decimal y '%'", () => {
    expect(formatCell(75.5, "pct")).toBe("75.5%");
    expect(formatCell(100, "pct")).toBe("100.0%");
  });

  it("formatea float con 2 decimales", () => {
    expect(formatCell(7.456, "float")).toBe("7.46");
    expect(formatCell(7, "float")).toBe("7.00");
  });

  it("sin format explícito actúa como int", () => {
    expect(formatCell(5)).toBe("5");
    expect(formatCell(5.9)).toBe("6");
  });
});
