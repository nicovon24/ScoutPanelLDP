"use client";
import { useScoutStore } from "@/store/useScoutStore";
import { useRouter } from "next/navigation";
import { BarChart2, X } from "lucide-react";
import Image from "next/image";

export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useScoutStore();
  const router = useRouter();

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl
                      px-4 py-3 shadow-2xl">
        {compareList.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-input overflow-hidden flex items-center justify-center text-xs text-secondary">
              {p.photoUrl
                ? <Image src={p.photoUrl} alt={p.name} width={32} height={32} unoptimized className="object-cover" />
                : p.name[0]}
            </div>
            <span className="text-sm font-medium text-primary max-w-[100px] truncate">{p.name}</span>
            <button onClick={() => removeFromCompare(p.id)}
                    className="text-muted hover:text-danger transition-colors">
              <X size={14} />
            </button>
          </div>
        ))}

        {compareList.length === 1 && (
          <span className="text-xs text-muted px-2">Seleccioná otro jugador</span>
        )}

        {compareList.length === 2 && (
          <button
            onClick={() => { router.push(`/compare?ids=${compareList.map(p => p.id).join(",")}`); }}
            className="btn btn-primary text-xs py-1.5 px-3 ml-2"
          >
            <BarChart2 size={14} />
            Comparar
          </button>
        )}

        <button onClick={clearCompare}
                className="text-muted hover:text-danger transition-colors ml-1">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
