"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Shield, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { posStyle, calcAgeStr } from "@/lib/utils";
import FlagImg from "@/components/ui/FlagImg";

interface RosterPlayer {
  id: number;
  name: string;
  position: string;
  photoUrl?: string | null;
  nationality?: string | null;
  marketValueM?: string | null;
  dateOfBirth?: string | null;
  contractType?: string | null;
  contractUntil?: string | null;
}

interface TeamDetail {
  id: number;
  name: string;
  country: string;
  logoUrl?: string | null;
  players: RosterPlayer[];
}

function contractLabel(t?: string | null) {
  if (t === "LOAN") return "Préstamo";
  if (t === "FREE") return "Libre";
  return "Definitivo";
}

export default function ClubPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<TeamDetail>(`/teams/${id}`)
      .then((r) => setTeam(r.data))
      .catch((e) => {
        if (e.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-green" size={32} />
      </div>
    );
  }

  if (notFound || !team) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center text-muted">
          <Shield size={28} />
        </div>
        <p className="text-lg font-black text-secondary">Club no encontrado</p>
        <p className="text-sm text-muted max-w-xs">El equipo que buscás no existe o fue eliminado.</p>
        <button
          onClick={() => router.back()}
          className="mt-2 flex items-center gap-2 text-sm font-bold text-green hover:text-green/80 transition-colors"
        >
          <ArrowLeft size={15} /> Volver
        </button>
      </div>
    );
  }

  const posGroups = [
    { label: "Arqueros", positions: ["GK"] },
    { label: "Defensores", positions: ["CB", "LB", "RB"] },
    { label: "Mediocampistas", positions: ["CDM", "CM", "CAM"] },
    { label: "Delanteros", positions: ["CF", "SS", "LW", "RW"] },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-bold text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft size={15} /> Volver
      </button>

      {/* Club Hero */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.05] bg-card">
        {/* Gradient backdrop */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(0,224,148,0.06) 0%, transparent 60%)" }} />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6 sm:p-10">
          {/* Logo */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-input border border-white/[0.07]
                          flex items-center justify-center overflow-hidden flex-shrink-0
                          shadow-[0_0_40px_rgba(0,224,148,0.08)]">
            {team.logoUrl ? (
              <Image
                src={team.logoUrl}
                alt={team.name}
                width={96}
                height={96}
                className="object-contain w-4/5 h-4/5"
                unoptimized
              />
            ) : (
              <Shield size={40} className="text-muted" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary mb-2">
              {team.name}
            </h1>

            <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
              {/* Country */}
              <div className="flex items-center gap-1.5 text-sm text-secondary font-semibold">
                <FlagImg nationality={team.country} size={13} />
                {team.country}
              </div>

              {/* Separator */}
              <span className="text-muted/40">·</span>

              {/* Squad size */}
              <div className="flex items-center gap-1.5 text-sm text-secondary font-semibold">
                <Users size={13} className="text-muted" />
                {team.players.length} jugadores
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roster grouped by position */}
      {team.players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-white/5 gap-3">
          <Users size={28} className="text-muted" />
          <p className="text-secondary font-bold">Sin jugadores registrados</p>
          <p className="text-muted text-sm">Este equipo no tiene jugadores asignados actualmente.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {posGroups.map(({ label, positions }) => {
            const group = team.players.filter((p) =>
              positions.includes(p.position?.toUpperCase())
            );
            if (group.length === 0) return null;
            return (
              <div key={label}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-green">
                    {label}
                  </span>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                  <span className="text-[11px] font-bold text-muted">{group.length}</span>
                </div>

                {/* Scroll wrapper for mobile */}
                <div className="relative">
                  <div className="overflow-x-auto rounded-xl border border-white/[0.05]">
                    <table className="w-full border-collapse" style={{ minWidth: 520 }}>
                      <thead>
                        <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                          <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted">
                            Jugador
                          </th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted">
                            Posición
                          </th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted hidden sm:table-cell">
                            Edad
                          </th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-widest text-muted">
                            Valor
                          </th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-widest text-muted hidden sm:table-cell">
                            Contrato
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.map((p, i) => (
                          <tr
                            key={p.id}
                            className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group
                                        ${i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"}`}
                          >
                            {/* Player */}
                            <td className="px-4 py-3">
                              <Link
                                href={`/players/${p.id}`}
                                className="flex items-center gap-3 min-w-0"
                              >
                                <div className="w-9 h-9 rounded-full bg-input border border-white/[0.05]
                                                flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {p.photoUrl ? (
                                    <Image
                                      src={p.photoUrl}
                                      alt={p.name}
                                      width={36}
                                      height={36}
                                      className="object-cover w-full h-full"
                                      unoptimized
                                    />
                                  ) : (
                                    <span className="text-xs font-black text-muted">{p.name[0]}</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-black text-primary truncate
                                                group-hover:text-green transition-colors">
                                    {p.name}
                                  </p>
                                  {p.nationality && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <FlagImg nationality={p.nationality} size={10} />
                                      <span className="text-[10px] text-muted">{p.nationality}</span>
                                    </div>
                                  )}
                                </div>
                              </Link>
                            </td>

                            {/* Position */}
                            <td className="px-4 py-3">
                              <span className={`badge text-[10px] ${posStyle(p.position)}`}>
                                {p.position}
                              </span>
                            </td>

                            {/* Age */}
                            <td className="px-4 py-3 text-sm text-secondary hidden sm:table-cell">
                              {calcAgeStr(p.dateOfBirth)}
                            </td>

                            {/* Market value */}
                            <td className="px-4 py-3 text-right">
                              {p.marketValueM ? (
                                <span className="text-sm font-black text-green">
                                  €{parseFloat(p.marketValueM).toFixed(1)}M
                                </span>
                              ) : (
                                <span className="text-sm text-muted">—</span>
                              )}
                            </td>

                            {/* Contract */}
                            <td className="px-4 py-3 text-right hidden sm:table-cell">
                              <div>
                                <span className="text-[10px] font-bold text-secondary">
                                  {contractLabel(p.contractType)}
                                </span>
                                {p.contractUntil && (
                                  <p className="text-[10px] text-muted mt-0.5">
                                    hasta {p.contractUntil.slice(0, 4)}
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile gradient scroll hint */}
                  <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-card/80 to-transparent
                                  pointer-events-none rounded-r-xl sm:hidden" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
