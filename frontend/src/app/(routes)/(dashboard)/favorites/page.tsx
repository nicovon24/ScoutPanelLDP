"use client";
import { useEffect, useState } from "react";
import { Star, Loader2, Trash2 } from "lucide-react";
import { useScoutStore } from "@/store/useScoutStore";
import api from "@/lib/api";
import PlayerCard from "@/components/player/PlayerCard";
import Link from "next/link";

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useScoutStore();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (favorites.length === 0) { setPlayers([]); return; }
    setLoading(true);
    // Fetch full data for each favorite
    Promise.all(favorites.map((f) => api.get(`/players/${f.id}`).then((r) => r.data)))
      .then(setPlayers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [favorites]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-gold" fill="currentColor" />
          <h1 className="text-xl font-bold text-primary">Favoritos</h1>
        </div>
        {favorites.length > 0 && (
          <span className="badge badge-muted">{favorites.length} jugadores</span>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
            <Star size={28} className="text-gold/50" />
          </div>
          <p className="text-muted text-sm text-center">
            No tenés jugadores favoritos aún.
          </p>
          <Link href="/players" className="btn btn-ghost text-xs">
            Explorar jugadores →
          </Link>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-green" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {players.map((p) => <PlayerCard key={p.id} player={p} />)}
        </div>
      )}
    </div>
  );
}
