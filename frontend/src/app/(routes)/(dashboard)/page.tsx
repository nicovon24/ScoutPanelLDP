"use client";
import { useEffect, useState } from "react";
import { Loader2, TrendingUp, Users, Trophy } from "lucide-react";
import api from "@/lib/api";
import PlayerCard from "@/components/player/PlayerCard";

interface Player {
  id: number; name: string; position: string;
  nationality?: string; dateOfBirth?: string;
  photoUrl?: string; marketValueM?: string;
  team?: { name: string; logoUrl?: string };
  stats?: { sofascoreRating?: string; goals?: number; assists?: number }[];
}

export default function HomePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/players?limit=30")
      .then(({ data }) => setPlayers(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const topRated = [...players]
    .sort((a, b) => parseFloat(b.stats?.[0]?.sofascoreRating ?? "0") - parseFloat(a.stats?.[0]?.sofascoreRating ?? "0"))
    .slice(0, 3);

  const mostValuable = [...players]
    .sort((a, b) => parseFloat(b.marketValueM ?? "0") - parseFloat(a.marketValueM ?? "0"))
    .slice(0, 3);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div>
        <h1 className="text-2xl font-bold text-primary">
          Liga Profesional <span className="text-green">Argentina</span>
        </h1>
        <p className="text-secondary text-sm mt-1">
          Temporada 2026 · {players.length} jugadores
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Jugadores", value: players.length, color: "text-purple" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-input ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-primary">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top Rated */}
      {topRated.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-green" />
            <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Top Rated</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topRated.map((p) => <PlayerCard key={p.id} player={p} />)}
          </div>
        </section>
      )}

      {/* All Players */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-secondary" />
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Todos los jugadores</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-green" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {players.map((p) => <PlayerCard key={p.id} player={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
