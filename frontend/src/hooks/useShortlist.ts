"use client";
import { useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useScoutStore } from "@/store/useScoutStore";
import api from "@/lib/api";
import type { ShortlistPlayer } from "@/types";

/**
 * Hook unificado de favoritos.
 * - Con sesión (token): usa el backend /api/shortlist (persistido por usuario).
 * - Sin sesión: usa el store local de Zustand.
 *
 * Fixes:
 * WR-02: en fallo de API no se setea shortlistFetched=true → se reintenta en el
 *        próximo montaje en lugar de quedar bloqueado para toda la sesión.
 * WR-06: pendingRef evita race conditions por doble click rápido.
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

  // WR-06: track in-flight mutations to prevent race conditions
  const pendingIds = useRef<Set<number>>(new Set());

  // Carga los IDs del servidor solo una vez por sesión exitosa
  useEffect(() => {
    if (!token || shortlistFetched) return;
    api.get<number[]>("/shortlist/ids")
      .then(({ data }) => {
        setShortlistIds(data);
        setShortlistFetched(true); // solo en éxito
      })
      .catch(() => {
        // WR-02: en fallo NO marcamos como fetched → se reintentará al remontar
        console.warn("useShortlist: fallo al cargar shortlist, se reintentará.");
      });
  }, [token, shortlistFetched, setShortlistIds, setShortlistFetched]);

  const isFavorite = useCallback(
    (id: number) => (token ? shortlistIds.includes(id) : localIsFav(id)),
    [token, shortlistIds, localIsFav],
  );

  const addFavorite = useCallback(
    async (player: ShortlistPlayer) => {
      if (pendingIds.current.has(player.id)) return; // WR-06: guard
      if (token) {
        pendingIds.current.add(player.id);
        try {
          await api.post(`/shortlist/${player.id}`);
          addShortlistId(player.id);
          toast.success(`${player.name} agregado a tu lista`);
        } catch (e) {
          console.error("Error agregando a shortlist", e);
          toast.error("No se pudo agregar el jugador");
        } finally {
          pendingIds.current.delete(player.id);
        }
      } else {
        localAdd(player);
        toast.success(`${player.name} agregado a tu lista`);
      }
    },
    [token, addShortlistId, localAdd],
  );

  const removeFavorite = useCallback(
    async (id: number) => {
      if (pendingIds.current.has(id)) return; // WR-06: guard
      if (token) {
        pendingIds.current.add(id);
        try {
          await api.delete(`/shortlist/${id}`);
          removeShortlistId(id);
          toast("Jugador removido de tu lista", { icon: "✕" });
        } catch (e) {
          console.error("Error quitando de shortlist", e);
          toast.error("No se pudo quitar el jugador");
        } finally {
          pendingIds.current.delete(id);
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
