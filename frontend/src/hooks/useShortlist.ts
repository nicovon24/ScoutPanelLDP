"use client";
import { useCallback, useEffect } from "react";
import { useScoutStore } from "@/store/useScoutStore";
import api from "@/lib/api";

export interface ShortlistPlayer {
  id: number;
  name: string;
  position: string;
  photoUrl?: string;
  marketValueM?: string;
  nationality?: string;
  team?: { name: string; logoUrl?: string };
}

/**
 * Hook unificado de favoritos.
 * - Con sesión (token): usa el backend /api/shortlist (persistido por usuario).
 * - Sin sesión: usa el store local de Zustand.
 *
 * El estado se almacena en Zustand (shortlistIds) para que todos los componentes
 * compartan los mismos IDs sin hacer fetches duplicados.
 */
export function useShortlist() {
  const {
    token,
    favorites,
    addFavorite: localAdd,
    removeFavorite: localRemove,
    isFavorite: localIsFav,
    shortlistIds,
    shortlistFetched,
    setShortlistIds,
    addShortlistId,
    removeShortlistId,
    setShortlistFetched,
  } = useScoutStore();

  // Carga los IDs del servidor solo una vez por sesión
  useEffect(() => {
    if (!token || shortlistFetched) return;
    api.get<number[]>("/shortlist/ids")
      .then(({ data }) => {
        setShortlistIds(data);
        setShortlistFetched(true);
      })
      .catch(() => {
        // Si falla (token expirado, etc.) no bloqueamos
        setShortlistFetched(true);
      });
  }, [token, shortlistFetched, setShortlistIds, setShortlistFetched]);

  const isFavorite = useCallback(
    (id: number) => (token ? shortlistIds.includes(id) : localIsFav(id)),
    [token, shortlistIds, localIsFav],
  );

  const addFavorite = useCallback(
    async (player: ShortlistPlayer) => {
      if (token) {
        try {
          await api.post(`/shortlist/${player.id}`);
          addShortlistId(player.id);
        } catch (e) {
          console.error("Error agregando a shortlist", e);
        }
      } else {
        localAdd(player);
      }
    },
    [token, addShortlistId, localAdd],
  );

  const removeFavorite = useCallback(
    async (id: number) => {
      if (token) {
        try {
          await api.delete(`/shortlist/${id}`);
          removeShortlistId(id);
        } catch (e) {
          console.error("Error quitando de shortlist", e);
        }
      } else {
        localRemove(id);
      }
    },
    [token, removeShortlistId, localRemove],
  );

  return {
    isFavorite,
    addFavorite,
    removeFavorite,
    /** true cuando hay sesión activa */
    isLoggedIn: !!token,
    /** Favoritos locales (sin sesión) */
    localFavorites: favorites,
  };
}
