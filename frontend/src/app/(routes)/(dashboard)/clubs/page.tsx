"use client";
import { useEffect, useState } from "react";
import { Globe, Loader2, Shield, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import type { Team } from "@/types";

interface TeamWithCount extends Team {
  id: number;
  playerCount?: number;
}

export default function ClubsPage() {
  const [teams, setTeams] = useState<TeamWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get<TeamWithCount[]>("/teams")
      .then((r) => {
        const sorted = [...r.data].sort((a, b) =>
          a.name.localeCompare(b.name, "es", { sensitivity: "base" })
        );
        setTeams(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.country ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary">Clubes</h1>
          <p className="text-sm text-muted mt-1">
            {loading ? "Cargando..." : `${teams.length} equipos registrados`}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar club o país..."
            className="w-full bg-card border border-white/[0.05] rounded-xl px-4 py-2.5 text-sm
                       text-primary placeholder:text-muted focus:outline-none
                       focus:border-green/40 focus:shadow-[0_0_16px_rgba(0,224,148,0.08)]
                       transition-all"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center text-muted">
            <Shield size={26} />
          </div>
          <p className="text-secondary font-bold">Sin resultados</p>
          <p className="text-sm text-muted">
            {search ? `No se encontraron clubes para "${search}"` : "No hay clubes registrados."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((team) => (
            <Link
              key={team.id}
              href={`/clubs/${team.id}`}
              className="group relative flex items-center gap-4 p-4 rounded-2xl
                         bg-card border border-white/[0.05]
                         hover:border-green/20 hover:bg-white/[0.03]
                         transition-all duration-200 overflow-hidden"
            >
              {/* Subtle glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(0,224,148,0.05) 0%, transparent 70%)" }} />

              {/* Logo */}
              <div className="w-14 h-14 rounded-xl bg-input border border-white/[0.05]
                              flex items-center justify-center flex-shrink-0 overflow-hidden
                              group-hover:border-green/20 transition-colors">
                {team.logoUrl ? (
                  <Image
                    src={team.logoUrl}
                    alt={team.name}
                    width={48}
                    height={48}
                    className="object-contain w-3/4 h-3/4"
                    unoptimized
                  />
                ) : (
                  <Shield size={22} className="text-muted" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-primary truncate group-hover:text-green transition-colors">
                  {team.name}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Globe size={11} className="text-muted flex-shrink-0" />
                  <span className="text-[11px] text-muted truncate">{team.country}</span>
                </div>
              </div>

              {/* Arrow hint */}
              <div className="text-muted/30 group-hover:text-green/50 transition-colors flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
