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

interface ScoutState {
  // Favoritos
  favorites: Player[];
  addFavorite: (player: Player) => void;
  removeFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;

  // Comparación
  compareList: Player[];
  addToCompare: (player: Player) => void;
  removeFromCompare: (id: number) => void;
  clearCompare: () => void;
  isInCompare: (id: number) => boolean;

  // Auth
  token: string | null;
  user: { id: number; name: string; email: string } | null;
  setAuth: (token: string, user: ScoutState["user"]) => void;
  clearAuth: () => void;
  // UI State
  filterPanelOpen: boolean;
  setFilterPanelOpen: (open: boolean) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  // Búsqueda y Filtros Home
  searchFilters: {
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
  };
  setSearchFilters: (filters: Partial<ScoutState["searchFilters"]>) => void;
  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (h: boolean) => void;
}



export const useScoutStore = create<ScoutState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (player) =>
        set((s) => ({ favorites: [...s.favorites.filter((f) => f.id !== player.id), player] })),
      removeFavorite: (id) =>
        set((s) => ({ favorites: s.favorites.filter((f) => f.id !== id) })),
      isFavorite: (id) => get().favorites.some((f) => f.id === id),

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
        if (typeof window !== "undefined") {
          localStorage.setItem("scout_token", token);
        }
        set({ token, user });
      },
      clearAuth: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("scout_token");
        }
        set({ token: null, user: null });
      },

      filterPanelOpen: false,
      setFilterPanelOpen: (open) => set({ filterPanelOpen: open }),
      pageSize: 30,
      setPageSize: (size) => set({ pageSize: size }),
      sidebarExpanded: false,
      setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
      searchFilters: {
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
      },
      setSearchFilters: (filters) => set((s) => ({
        searchFilters: {
          ...(s.searchFilters || { q: "", position: "", teamId: "", foot: "", ageMin: "", ageMax: "", heightMin: "", heightMax: "", minRating: "6.0", marketValueMax: "", sortBy: "rating_desc" }),
          ...filters
        }
      })),
      _hasHydrated: false,
      setHasHydrated: (h) => set({ _hasHydrated: h }),
    }),
    {
      name: "scout-store",
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
    }
  )
);
