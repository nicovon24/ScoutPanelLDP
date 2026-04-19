import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Player {
  id: number;
  name: string;
  position: string;
  photoUrl?: string;
  marketValueM?: string;
  nationality?: string;
  team?: { name: string; logoUrl?: string };
}

interface SearchFilters {
  q: string;
  position: string;
  teamId: string;
  foot: string;
  ageMin: string;
  ageMax: string;
  heightMin: string;
  heightMax: string;
  minRating: string;
  marketValueMax: string;
  sortBy: string;
}

const DEFAULT_FILTERS: SearchFilters = {
  q: "",
  position: "",
  teamId: "",
  foot: "",
  ageMin: "",
  ageMax: "",
  heightMin: "",
  heightMax: "",
  minRating: "6.0",
  marketValueMax: "",
  sortBy: "rating_desc",
};

interface ScoutState {
  // ─── Favoritos locales (sin sesión) ──────────────────────────────────────
  favorites: Player[];
  addFavorite: (player: Player) => void;
  removeFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;

  // ─── Shortlist del servidor (con sesión) ──────────────────────────────────
  /** IDs de la shortlist del usuario en el servidor (no persistidos). */
  shortlistIds: number[];
  shortlistFetched: boolean;
  setShortlistIds: (ids: number[]) => void;
  addShortlistId: (id: number) => void;
  removeShortlistId: (id: number) => void;
  setShortlistFetched: (v: boolean) => void;

  // ─── Comparación ──────────────────────────────────────────────────────────
  compareList: Player[];
  addToCompare: (player: Player) => void;
  removeFromCompare: (id: number) => void;
  clearCompare: () => void;
  isInCompare: (id: number) => boolean;

  // ─── Auth ─────────────────────────────────────────────────────────────────
  token: string | null;
  user: { id: number; name: string; email: string } | null;
  setAuth: (token: string, user: ScoutState["user"]) => void;
  clearAuth: () => void;

  // ─── UI ───────────────────────────────────────────────────────────────────
  filterPanelOpen: boolean;
  setFilterPanelOpen: (open: boolean) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;

  // ─── Filtros de búsqueda ──────────────────────────────────────────────────
  searchFilters: SearchFilters;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;

  // ─── Hydration ────────────────────────────────────────────────────────────
  _hasHydrated: boolean;
  setHasHydrated: (h: boolean) => void;
}

export const useScoutStore = create<ScoutState>()(
  persist(
    (set, get) => ({
      // ── Favoritos locales ────────────────────────────────────────────────
      favorites: [],
      addFavorite: (player) =>
        set((s) => ({ favorites: [...s.favorites.filter((f) => f.id !== player.id), player] })),
      removeFavorite: (id) =>
        set((s) => ({ favorites: s.favorites.filter((f) => f.id !== id) })),
      isFavorite: (id) => get().favorites.some((f) => f.id === id),

      // ── Shortlist del servidor ───────────────────────────────────────────
      shortlistIds: [],
      shortlistFetched: false,
      setShortlistIds: (ids) => set({ shortlistIds: ids }),
      addShortlistId: (id) =>
        set((s) => ({ shortlistIds: s.shortlistIds.includes(id) ? s.shortlistIds : [...s.shortlistIds, id] })),
      removeShortlistId: (id) =>
        set((s) => ({ shortlistIds: s.shortlistIds.filter((i) => i !== id) })),
      setShortlistFetched: (v) => set({ shortlistFetched: v }),

      // ── Comparación ─────────────────────────────────────────────────────
      compareList: [],
      addToCompare: (player) => {
        const list = get().compareList;
        if (list.length >= 3 || list.some((p) => p.id === player.id)) return;
        set({ compareList: [...list, player] });
      },
      removeFromCompare: (id) =>
        set((s) => ({ compareList: s.compareList.filter((p) => p.id !== id) })),
      clearCompare: () => set({ compareList: [] }),
      isInCompare: (id) => get().compareList.some((p) => p.id === id),

      // ── Auth ─────────────────────────────────────────────────────────────
      token: null,
      user: null,
      setAuth: (token, user) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", token);
        }
        // Resetear shortlist al cambiar de sesión
        set({ token, user, shortlistIds: [], shortlistFetched: false });
      },
      clearAuth: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
        }
        set({ token: null, user: null, shortlistIds: [], shortlistFetched: false });
      },

      // ── UI ───────────────────────────────────────────────────────────────
      filterPanelOpen: false,
      setFilterPanelOpen: (open) => set({ filterPanelOpen: open }),
      pageSize: 30,
      setPageSize: (size) => set({ pageSize: size }),
      sidebarExpanded: false,
      setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),

      // ── Filtros ──────────────────────────────────────────────────────────
      searchFilters: DEFAULT_FILTERS,
      setSearchFilters: (filters) =>
        set((s) => ({ searchFilters: { ...(s.searchFilters ?? DEFAULT_FILTERS), ...filters } })),

      // ── Hydration ────────────────────────────────────────────────────────
      _hasHydrated: false,
      setHasHydrated: (h) => set({ _hasHydrated: h }),
    }),
    {
      name: "scout-store",
      // shortlistIds y shortlistFetched NO se persisten (son estado del servidor)
      partialize: (s) => ({
        favorites: s.favorites,
        compareList: s.compareList,
        token: s.token,
        user: s.user,
        pageSize: s.pageSize,
        sidebarExpanded: s.sidebarExpanded,
        searchFilters: s.searchFilters,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
