import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import Cookies from "js-cookie";

const TOKEN_COOKIE = "accessToken";
const COOKIE_OPTS: Cookies.CookieAttributes = {
  expires: 7,       // 7 días
  sameSite: "Strict",
  secure: process.env.NODE_ENV === "production",
};

interface Player {
  id: number;
  name: string;
  position: string;
  photoUrl?: string;
  marketValueM?: string;
  nationality?: string;
  team?: { name: string; logoUrl?: string | null };
}

interface SearchFilters {
  q: string;
  position: string;
  teamId: string;
  ageMin: string;
  ageMax: string;
  minRating: string;
  marketValueMin: string;
  marketValueMax: string;
  nationality: string;
  contractType: string;
  sortBy: string;
}

export const DEFAULT_FILTERS: SearchFilters = {
  q: "",
  position: "",
  teamId: "",
  ageMin: "",
  ageMax: "",
  minRating: "6.0",
  marketValueMin: "",
  marketValueMax: "",
  nationality: "",
  contractType: "",
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
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  searchType: "all" | "players" | "clubs";
  setSearchType: (type: "all" | "players" | "clubs") => void;

  // ─── Filtros de búsqueda ──────────────────────────────────────────────────
  searchFilters: SearchFilters;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;

  // ─── Hydration ────────────────────────────────────────────────────────────
  _hasHydrated: boolean;
  setHasHydrated: (h: boolean) => void;
}

export const useScoutStore = create<ScoutState>()(
  devtools(
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

      // ── Auth — token leído desde cookie al iniciar ────────────────────────
      token: typeof window !== "undefined" ? (Cookies.get(TOKEN_COOKIE) ?? null) : null,
      user: null,
      setAuth: (token, user) => {
        Cookies.set(TOKEN_COOKIE, token, COOKIE_OPTS);
        set({ token, user, shortlistIds: [], shortlistFetched: false });
      },
      clearAuth: () => {
        Cookies.remove(TOKEN_COOKIE);
        set({ token: null, user: null, shortlistIds: [], shortlistFetched: false });
      },

      // ── UI ───────────────────────────────────────────────────────────────
      filterPanelOpen: false,
      setFilterPanelOpen: (open) => set({ filterPanelOpen: open }),
      pageSize: 30,
      setPageSize: (size) => set({ pageSize: size }),
      sidebarExpanded: false,
      setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      searchType: "all",
      setSearchType: (type) => set({ searchType: type }),

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
        searchFilters: s.searchFilters,
        pageSize: s.pageSize,
        sidebarExpanded: s.sidebarExpanded,
        compareList: s.compareList,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Normalize searchFilters — fills any missing fields after schema changes
          state.searchFilters = { ...DEFAULT_FILTERS, ...(state.searchFilters ?? {}) };
          state.setHasHydrated(true);
        }
      },
    },
  ),
  { name: "ScoutStore", enabled: process.env.NODE_ENV === "development" }
  ),
);
