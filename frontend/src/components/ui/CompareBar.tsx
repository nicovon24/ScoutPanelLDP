"use client";
import { useScoutStore } from "@/store/useScoutStore";
import { useRouter } from "next/navigation";
import { BarChart2, X } from "lucide-react";
import AppButton from "@/components/ui/AppButton";
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
            <AppButton
              type="button"
              isIconOnly
              variant="light"
              disableRipple
              onPress={() => removeFromCompare(p.id)}
              className="!min-w-0 w-7 h-7 min-w-7 text-muted hover:text-danger bg-transparent"
              aria-label={`Quitar ${p.name} de comparar`}
            >
              <X size={14} />
            </AppButton>
          </div>
        ))}

        {compareList.length === 1 && (
          <span className="text-xs text-muted px-2">Seleccioná otro jugador</span>
        )}

        {compareList.length === 2 && (
          <AppButton
            type="button"
            variant="primary"
            disableRipple
            onPress={() => { router.push(`/compare?ids=${compareList.map(p => p.id).join(",")}`); }}
            className="!min-h-0 h-auto text-xs py-1.5 px-3 ml-2 gap-1.5"
          >
            <BarChart2 size={14} />
            Comparar
          </AppButton>
        )}

        <AppButton
          type="button"
          isIconOnly
          variant="light"
          disableRipple
          onPress={clearCompare}
          className="!min-w-0 w-8 h-8 min-w-8 text-muted hover:text-danger bg-transparent ml-1"
          aria-label="Limpiar comparación"
        >
          <X size={16} />
        </AppButton>
      </div>
    </div>
  );
}
