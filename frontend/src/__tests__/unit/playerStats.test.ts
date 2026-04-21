import { describe, it, expect } from "vitest";
import {
  posGroup,
  reorderSections,
  fmtNum,
  asNum,
  buildRatingHistory,
  buildValueHistory,
  SECTIONS,
} from "@/lib/playerStats";
import type { Player } from "@/types";

// ── posGroup ──────────────────────────────────────────────────────────────────

describe("posGroup", () => {
  it("GK → 'GK'", () => expect(posGroup("GK")).toBe("GK"));
  it("CB / LB / RB → 'DEF'", () => {
    expect(posGroup("CB")).toBe("DEF");
    expect(posGroup("LB")).toBe("DEF");
    expect(posGroup("RB")).toBe("DEF");
  });
  it("CM / CAM / CDM → 'MID'", () => {
    expect(posGroup("CM")).toBe("MID");
    expect(posGroup("CAM")).toBe("MID");
    expect(posGroup("CDM")).toBe("MID");
  });
  it("CF / LW / SS → 'ATT'", () => {
    expect(posGroup("CF")).toBe("ATT");
    expect(posGroup("LW")).toBe("ATT");
    expect(posGroup("SS")).toBe("ATT");
  });
  it("posición desconocida → 'ATT' (fallback)", () => {
    expect(posGroup("XX")).toBe("ATT");
  });
  it("acepta lowercase", () => {
    expect(posGroup("gk")).toBe("GK");
    expect(posGroup("cb")).toBe("DEF");
  });
  it("undefined → 'ATT' (no lanza)", () => {
    expect(() => posGroup(undefined)).not.toThrow();
    expect(posGroup(undefined)).toBe("ATT");
  });
});

// ── reorderSections ───────────────────────────────────────────────────────────

describe("reorderSections", () => {
  it("para GK, Portería aparece primero", () => {
    const ordered = reorderSections(SECTIONS, "GK");
    expect(ordered[0].label).toBe("Portería");
  });

  it("para CF (ATT), Ataque aparece primero", () => {
    const ordered = reorderSections(SECTIONS, "CF");
    expect(ordered[0].label).toBe("Ataque");
  });

  it("para CB (DEF), Defensa aparece primero", () => {
    const ordered = reorderSections(SECTIONS, "CB");
    expect(ordered[0].label).toBe("Defensa");
  });

  it("para CM (MID), Pases & Creación aparece primero", () => {
    const ordered = reorderSections(SECTIONS, "CM");
    expect(ordered[0].label).toBe("Pases & Creación");
  });

  it("preserva todas las secciones originales", () => {
    const original = SECTIONS.map((s) => s.label).sort();
    const ordered  = reorderSections(SECTIONS, "GK").map((s) => s.label).sort();
    expect(ordered).toEqual(original);
  });

  it("no muta el array original", () => {
    const labels = SECTIONS.map((s) => s.label);
    reorderSections(SECTIONS, "CF");
    expect(SECTIONS.map((s) => s.label)).toEqual(labels);
  });
});

// ── fmtNum ────────────────────────────────────────────────────────────────────

describe("fmtNum", () => {
  it("devuelve '—' para null", () => expect(fmtNum(null)).toBe("—"));
  it("devuelve '—' para undefined", () => expect(fmtNum(undefined)).toBe("—"));
  it("devuelve '—' para string vacío", () => expect(fmtNum("")).toBe("—"));
  it("formatea entero", () => expect(fmtNum(10)).toBe("10"));
  it("formatea con 1 decimal", () => expect(fmtNum(7.456, 1)).toBe("7.5"));
  it("parsea strings numéricos", () => expect(fmtNum("8.5", 1)).toBe("8.5"));
  it("devuelve '—' para NaN string", () => expect(fmtNum("abc")).toBe("—"));
});

// ── asNum ─────────────────────────────────────────────────────────────────────

describe("asNum", () => {
  it("convierte number directamente", () => expect(asNum(7)).toBe(7));
  it("parsea string numérico", () => expect(asNum("3.5")).toBe(3.5));
  it("retorna 0 para null", () => expect(asNum(null)).toBe(0));
  it("retorna 0 para undefined", () => expect(asNum(undefined)).toBe(0));
  it("retorna 0 para string no numérico", () => expect(asNum("abc")).toBe(0));
});

// ── buildRatingHistory ────────────────────────────────────────────────────────

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 1,
    name: "Test Player",
    position: "CF",
    nationality: "ARG",
    team: null,
    stats: [],
    ratings: [],
    injuries: [],
    strengths: [],
    weaknesses: [],
    photoUrl: null,
    marketValueM: null,
    dateOfBirth: null,
    contractType: "PERMANENT",
    contractUntil: null,
    debutYear: null,
    heightCm: null,
    weightKg: null,
    preferredFoot: null,
    createdAt: "",
    ...overrides,
  } as Player;
}

describe("buildRatingHistory — modo monthly", () => {
  it("devuelve 12 entradas (una por mes)", () => {
    const player = makePlayer();
    const result = buildRatingHistory(player, null, "month");
    expect(result).toHaveLength(12);
  });

  it("sin ratings, todos los valores son 0", () => {
    const player = makePlayer();
    const result = buildRatingHistory(player, null, "month");
    result.forEach((e) => expect(e.rating).toBe(0));
  });

  it("inyecta el rating del mes correcto", () => {
    const player = makePlayer({
      ratings: [{ ratingByMonth: { "2026-03": 8.5 }, seasonId: 1 } as never],
    });
    const result = buildRatingHistory(player, null, "month");
    const mar = result.find((e) => e.month === "Mar")!;
    expect(mar.rating).toBe(8.5);
  });

  it("meses sin datos tienen rating 0, no null/undefined", () => {
    const player = makePlayer({
      ratings: [{ ratingByMonth: { "2026-01": 7.0 }, seasonId: 1 } as never],
    });
    const result = buildRatingHistory(player, null, "month");
    const feb = result.find((e) => e.month === "Feb")!;
    expect(feb.rating).toBe(0);
  });

  it("todos los entries tienen la propiedad 'injured' (boolean)", () => {
    const player = makePlayer();
    buildRatingHistory(player, null, "month").forEach((e) => {
      expect(typeof e.injured).toBe("boolean");
    });
  });
});

describe("buildRatingHistory — modo year", () => {
  it("sin ratings retorna array vacío", () => {
    const player = makePlayer();
    expect(buildRatingHistory(player, null, "year")).toHaveLength(0);
  });

  it("agrupa correctamente por año", () => {
    const player = makePlayer({
      ratings: [
        { ratingByMonth: { "2024-01": 7.0, "2024-06": 8.0 }, seasonId: 1 } as never,
        { ratingByMonth: { "2025-03": 9.0 }, seasonId: 2 } as never,
      ],
    });
    const result = buildRatingHistory(player, null, "year");
    expect(result).toHaveLength(2);
    const entry2024 = result.find((e) => e.month === "2024")!;
    expect(entry2024.rating).toBeCloseTo(7.5, 5);
  });
});

// ── buildValueHistory — smoke test ────────────────────────────────────────────

describe("buildValueHistory — modo monthly", () => {
  it("devuelve exactamente 12 entradas", () => {
    const player = makePlayer({ marketValueM: "10" });
    expect(buildValueHistory(player, null, "month")).toHaveLength(12);
  });

  it("cada entry tiene 'future' boolean", () => {
    const player = makePlayer({ marketValueM: "5" });
    buildValueHistory(player, null, "month").forEach((e) => {
      expect(typeof e.future).toBe("boolean");
    });
  });
});
