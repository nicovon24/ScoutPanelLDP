"use client";
import { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { useScoutStore } from "@/store/useScoutStore";
import { useShortlist } from "@/hooks/useShortlist";
import api from "@/lib/api";
import PlayerCard from "@/components/player/PlayerCard";
import Link from "next/link";

export default function FavoritesPage() {
  const { token, favorites } = useScoutStore();
  const { removeFavorite } = useShortlist();

  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      // Con sesión: traer la shortlist completa del backend (1 sola llamada)
      setLoading(true);
      api.get("/shortlist")
        .then(({ data }) => setPlayers(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      // Sin sesión: enriquecer el store local con datos individuales
      if (favorites.length === 0) { setPlayers([]); return; }
      setLoading(true);
      Promise.all(favorites.map((f) => api.get(`/players/${f.id}`).then((r) => r.data)))
        .then(setPlayers)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token, favorites]);

  const isEmpty = token ? !loading && players.length === 0 : favorites.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-gold" fill="currentColor" />
          <h1 className="text-xl font-bold text-primary">Favoritos</h1>
          {!token && (
            <span className="badge badge-muted text-2xs">local</span>
          )}
        </div>
        {players.length > 0 && (
          <span className="badge badge-muted">{players.length} jugadores</span>
        )}
      </div>

      {!token && (
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
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-green" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {players.map((p) => (
            <div key={p.id} className="relative group/card">
              <PlayerCard player={p} />
              <button
                onClick={() => {
                  removeFavorite(p.id);
                  setPlayers((prev) => prev.filter((pl) => pl.id !== p.id));
                }}
                className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-gold hover:bg-danger/20 hover:border-danger/30 hover:text-danger transition-all opacity-0 group-hover/card:opacity-100"
                title="Quitar de favoritos"
              >
                <Star size={12} fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
