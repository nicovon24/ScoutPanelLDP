import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

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
  favorites: Player[];
  addFavorite: (player: Player) => void;
  removeFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;

  shortlistIds: number[];
  shortlistFetched: boolean;
  setShortlistIds: (ids: number[]) => void;
  addShortlistId: (id: number) => void;
  removeShortlistId: (id: number) => void;
  setShortlistFetched: (v: boolean) => void;

  compareList: Player[];
  addToCompare: (player: Player) => void;
  removeFromCompare: (id: number) => void;
  clearCompare: () => void;
  isInCompare: (id: number) => boolean;

  /** JWT en memoria (misma sesión). Tras F5, solo cookie httpOnly + /auth/me restaura `user`. */
  token: string | null;
  user: { id: number; name: string; email: string } | null;
  setAuth: (token: string, user: ScoutState["user"]) => void;
  /** Sesión restaurada vía cookie httpOnly + GET /auth/me (sin token en memoria). */
  setUserFromSession: (user: NonNullable<ScoutState["user"]>) => void;
  clearAuth: () => void;

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

  searchFilters: SearchFilters;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;

  _hasHydrated: boolean;
  setHasHydrated: (h: boolean) => void;
}

export const useScoutStore = create<ScoutState>()(
  devtools(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (player) =>
        set((s) => ({ favorites: [...s.favorites.filter((f) => f.id !== player.id), player] })),
      removeFavorite: (id) =>
        set((s) => ({ favorites: s.favorites.filter((f) => f.id !== id) })),
      isFavorite: (id) => get().favorites.some((f) => f.id === id),

      shortlistIds: [],
      shortlistFetched: false,
      setShortlistIds: (ids) => set({ shortlistIds: ids }),
      addShortlistId: (id) =>
        set((s) => ({ shortlistIds: s.shortlistIds.includes(id) ? s.shortlistIds : [...s.shortlistIds, id] })),
      removeShortlistId: (id) =>
        set((s) => ({ shortlistIds: s.shortlistIds.filter((i) => i !== id) })),
      setShortlistFetched: (v) => set({ shortlistFetched: v }),

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

      token: null,
      user: null,
      setAuth: (token, user) => {
        set({ token, user, shortlistIds: [], shortlistFetched: false });
      },
      setUserFromSession: (user) => {
        set({ user, token: null, shortlistIds: [], shortlistFetched: false });
      },
      clearAuth: () => {
        set({ token: null, user: null, shortlistIds: [], shortlistFetched: false });
      },

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

      searchFilters: DEFAULT_FILTERS,
      setSearchFilters: (filters) =>
        set((s) => ({ searchFilters: { ...(s.searchFilters ?? DEFAULT_FILTERS), ...filters } })),

      _hasHydrated: false,
      setHasHydrated: (h) => set({ _hasHydrated: h }),
    }),
    {
      name: "scout-store",
      partialize: (s) => ({
        searchFilters: s.searchFilters,
        pageSize: s.pageSize,
        sidebarExpanded: s.sidebarExpanded,
        compareList: s.compareList,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.searchFilters = { ...DEFAULT_FILTERS, ...(state.searchFilters ?? {}) };
          state.setHasHydrated(true);
        }
      },
    },
  ),
  { name: "ScoutStore", enabled: process.env.NODE_ENV === "development" }
  ),
);
