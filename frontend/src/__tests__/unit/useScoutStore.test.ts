import { describe, it, expect, beforeEach } from "vitest";
import { useScoutStore } from "@/store/useScoutStore";

type Player = Parameters<ReturnType<typeof useScoutStore.getState>["addFavorite"]>[0];

function makePlayer(id: number): Player {
  return {
    id,
    name: `Player ${id}`,
    position: "CF",
    nationality: "ARG",
  };
}

beforeEach(() => {
  useScoutStore.setState({ favorites: [], compareList: [] });
});

// ── Favoritos ─────────────────────────────────────────────────────────────────

describe("addFavorite / removeFavorite", () => {
  it("agrega un jugador a favoritos", () => {
    useScoutStore.getState().addFavorite(makePlayer(1));
    expect(useScoutStore.getState().favorites).toHaveLength(1);
  });

  it("no agrega duplicados", () => {
    useScoutStore.getState().addFavorite(makePlayer(1));
    useScoutStore.getState().addFavorite(makePlayer(1));
    expect(useScoutStore.getState().favorites).toHaveLength(1);
  });

  it("agrega jugadores distintos correctamente", () => {
    useScoutStore.getState().addFavorite(makePlayer(1));
    useScoutStore.getState().addFavorite(makePlayer(2));
    expect(useScoutStore.getState().favorites).toHaveLength(2);
  });

  it("elimina un jugador por id", () => {
    useScoutStore.getState().addFavorite(makePlayer(1));
    useScoutStore.getState().addFavorite(makePlayer(2));
    useScoutStore.getState().removeFavorite(1);
    const ids = useScoutStore.getState().favorites.map((f) => f.id);
    expect(ids).toEqual([2]);
  });

  it("isFavorite retorna true después de agregar", () => {
    useScoutStore.getState().addFavorite(makePlayer(5));
    expect(useScoutStore.getState().isFavorite(5)).toBe(true);
  });

  it("isFavorite retorna false para jugador no agregado", () => {
    expect(useScoutStore.getState().isFavorite(99)).toBe(false);
  });
});

// ── Comparación ───────────────────────────────────────────────────────────────

describe("addToCompare", () => {
  it("agrega hasta 3 jugadores", () => {
    [1, 2, 3].forEach((id) => useScoutStore.getState().addToCompare(makePlayer(id)));
    expect(useScoutStore.getState().compareList).toHaveLength(3);
  });

  it("no agrega un cuarto jugador (cap = 3)", () => {
    [1, 2, 3, 4].forEach((id) => useScoutStore.getState().addToCompare(makePlayer(id)));
    expect(useScoutStore.getState().compareList).toHaveLength(3);
    const ids = useScoutStore.getState().compareList.map((p) => p.id);
    expect(ids).not.toContain(4);
  });

  it("no agrega duplicados en compareList", () => {
    useScoutStore.getState().addToCompare(makePlayer(1));
    useScoutStore.getState().addToCompare(makePlayer(1));
    expect(useScoutStore.getState().compareList).toHaveLength(1);
  });

  it("removeFromCompare elimina el jugador correcto", () => {
    [1, 2, 3].forEach((id) => useScoutStore.getState().addToCompare(makePlayer(id)));
    useScoutStore.getState().removeFromCompare(2);
    const ids = useScoutStore.getState().compareList.map((p) => p.id);
    expect(ids).toEqual([1, 3]);
  });

  it("clearCompare vacía la lista por completo", () => {
    [1, 2].forEach((id) => useScoutStore.getState().addToCompare(makePlayer(id)));
    useScoutStore.getState().clearCompare();
    expect(useScoutStore.getState().compareList).toHaveLength(0);
  });

  it("isInCompare retorna true/false correctamente", () => {
    useScoutStore.getState().addToCompare(makePlayer(7));
    expect(useScoutStore.getState().isInCompare(7)).toBe(true);
    expect(useScoutStore.getState().isInCompare(8)).toBe(false);
  });
});

// ── searchFilters ─────────────────────────────────────────────────────────────

describe("setSearchFilters (merge parcial)", () => {
  it("aplica campos parciales sin pisar el resto", () => {
    const before = useScoutStore.getState().searchFilters;
    useScoutStore.getState().setSearchFilters({ q: "messi" });
    const after = useScoutStore.getState().searchFilters;
    expect(after.q).toBe("messi");
    expect(after.position).toBe(before.position);
    expect(after.sortBy).toBe(before.sortBy);
  });

  it("permite resetear un campo a string vacío", () => {
    useScoutStore.getState().setSearchFilters({ q: "messi" });
    useScoutStore.getState().setSearchFilters({ q: "" });
    expect(useScoutStore.getState().searchFilters.q).toBe("");
  });

  it("aplica múltiples campos en una llamada", () => {
    useScoutStore.getState().setSearchFilters({ position: "CF", nationality: "ARG" });
    const f = useScoutStore.getState().searchFilters;
    expect(f.position).toBe("CF");
    expect(f.nationality).toBe("ARG");
  });
});
 