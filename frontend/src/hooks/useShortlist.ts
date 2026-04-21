"use client";
import { useCallback, useEffect, useRef } from "react";
import { appToast } from "@/lib/appToast";
import { useScoutStore } from "@/store/useScoutStore";
import api from "@/lib/api";
import type { ShortlistPlayer } from "@/types";

// Module-level singleton: prevents concurrent calls when multiple components
// using this hook mount at the same time before the first request resolves.
let _fetchingPromise: Promise<void> | null = null;

/**
 * Hook unificado de favoritos.
 * - Con sesión (JWT en memoria o cookie httpOnly + user restaurado): usa /api/shortlist.
 * - Sin sesión: store local de Zustand.
 */
export function useShortlist() {
  const {
    token,
    user,
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

  const serverSession = !!(token || user);

  const pendingIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!serverSession || shortlistFetched || _fetchingPromise) return;
    _fetchingPromise = api.get<number[]>("/shortlist/ids")
      .then(({ data }) => {
        setShortlistIds(data);
        setShortlistFetched(true);
      })
      .catch(() => {
        console.warn("useShortlist: fallo al cargar shortlist, se reintentará.");
      })
      .finally(() => {
        _fetchingPromise = null;
      });
  }, [serverSession, shortlistFetched, setShortlistIds, setShortlistFetched]);

  const isFavorite = useCallback(
    (id: number) => (serverSession ? shortlistIds.includes(id) : localIsFav(id)),
    [serverSession, shortlistIds, localIsFav],
  );

  const addFavorite = useCallback(
    async (player: ShortlistPlayer) => {
      if (pendingIds.current.has(player.id)) return;
      if (serverSession) {
        pendingIds.current.add(player.id);
        try {
          await api.post(`/shortlist/${player.id}`);
          addShortlistId(player.id);
          appToast.success(`${player.name} agregado a tu lista`);
        } catch (e) {
          console.error("Error agregando a shortlist", e);
          appToast.error("No se pudo agregar el jugador");
        } finally {
          pendingIds.current.delete(player.id);
        }
      } else {
        localAdd(player);
        appToast.success(`${player.name} agregado a tu lista`);
      }
    },
    [serverSession, addShortlistId, localAdd],
  );

  const removeFavorite = useCallback(
    async (id: number) => {
      if (pendingIds.current.has(id)) return;
      if (serverSession) {
        pendingIds.current.add(id);
        try {
          await api.delete(`/shortlist/${id}`);
          removeShortlistId(id);
          appToast.neutral("Jugador removido de tu lista", { icon: "✕" });
        } catch (e) {
          console.error("Error quitando de shortlist", e);
          appToast.error("No se pudo quitar el jugador");
        } finally {
          pendingIds.current.delete(id);
        }
      } else {
        localRemove(id);
      }
    },
    [serverSession, removeShortlistId, localRemove],
  );

  return {
    isFavorite,
    addFavorite,
    removeFavorite,
    isLoggedIn: serverSession,
    localFavorites: favorites,
  };
}
