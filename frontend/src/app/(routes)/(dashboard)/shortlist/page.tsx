"use client";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { PlayerGridSkeleton } from "@/components/ui/Skeleton";
import { useScoutStore } from "@/store/useScoutStore";
import { useShortlist } from "@/hooks/useShortlist";
import api from "@/lib/api";
import PlayerCard from "@/components/player/PlayerCard";
import AppButton from "@/components/ui/AppButton";
import Link from "next/link";
import type { Player } from "@/types";

export default function ShortlistPage() {
  const { token, user, favorites } = useScoutStore();
  const { removeFavorite } = useShortlist();
  const serverSession = !!(token || user);

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (serverSession) {
      setLoading(true);
      api.get<Player[]>("/shortlist")
        .then(({ data }) => setPlayers(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      if (favorites.length === 0) { setPlayers([]); return; }
      setLoading(true);
      Promise.all(favorites.map((f) => api.get<Player>(`/players/${f.id}`).then((r) => r.data)))
        .then(setPlayers)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [serverSession, favorites]);

  const isEmpty = serverSession ? !loading && players.length === 0 : favorites.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-gold" fill="currentColor" />
          <h1 className="text-xl font-bold text-primary">Favoritos</h1>
          {!serverSession && (
            <span className="badge badge-muted text-2xs">local</span>
          )}
        </div>
        {players.length > 0 && (
          <span className="badge badge-muted">{players.length} jugadores</span>
        )}
      </div>

      {!serverSession && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-white/[0.02] text-sm text-secondary">
          <Star size={13} className="text-gold flex-shrink-0" />
          <span>
            Iniciá sesión para guardar tus favoritos en la nube y accederlos desde cualquier dispositivo.{" "}
            <Link href="/login" className="text-green font-bold hover:underline">Ingresar</Link>
          </span>
        </div>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
            <Star size={28} className="text-gold/50" />
          </div>
          <p className="text-muted text-sm text-center">
            No tenés jugadores favoritos aún.
          </p>
          <Link href="/" className="btn btn-ghost text-xs">
            Explorar jugadores →
          </Link>
        </div>
      ) : loading ? (
        <PlayerGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {players.map((p) => (
            <div key={p.id} className="relative group/card">
              <PlayerCard player={p} hideFavBtn />
              <AppButton
                type="button"
                variant="light"
                disableRipple
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeFavorite(p.id);
                  setPlayers((prev) => prev.filter((pl) => pl.id !== p.id));
                }}
                className="absolute top-3 right-3 z-10 !min-h-0 h-auto gap-1.5 px-2.5 py-1.5
                           rounded-full bg-black/75 border border-white/10 backdrop-blur-sm
                           text-gold text-[11px] font-bold
                           hover:bg-danger/20 hover:border-danger/30 hover:text-danger
                           transition-all duration-200
                           opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100
                           scale-100 sm:scale-90 sm:group-hover/card:scale-100"
                title="Quitar de favoritos"
              >
                <Star size={11} fill="currentColor" />
                <span>Quitar</span>
              </AppButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
