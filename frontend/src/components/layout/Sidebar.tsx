"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Star, TrendingUp, LogOut, Menu, ChevronLeft, X, Shield } from "lucide-react";
import { useScoutStore } from "@/store/useScoutStore";
import LinkNext from "next/link";
import SearchBar from "@/components/ui/SearchBar";
import AppButton from "@/components/ui/AppButton";
import api from "@/lib/api";

const NAV_ITEMS = [
  { href: "/",          icon: Home,        label: "Jugadores" },
  { href: "/compare",   icon: BarChart2,   label: "Comparar" },
  { href: "/shortlist", icon: Star,        label: "Favoritos" },
  { href: "/analytics", icon: TrendingUp,  label: "Reportes" },
  { href: "/clubs",     icon: Shield,      label: "Clubes" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const {
    compareList, clearAuth,
    sidebarExpanded, setSidebarExpanded,
    token, user, shortlistIds, favorites,
    mobileMenuOpen, setMobileMenuOpen,
  } = useScoutStore();
  const favCount = (token || user) ? shortlistIds.length : favorites.length;

  // Cerrar el drawer mobile al cambiar de ruta (ej: navegación desde el SearchBar)
  useEffect(() => {
    setMobileMenuOpen(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[75] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 bottom-0 bg-[#0A0A0A] border-r border-white/[0.05]
          flex flex-col py-6 z-[80] transition-all duration-300 ease-in-out
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          ${sidebarExpanded ? "w-64 px-4" : "lg:w-20 lg:px-3 lg:items-center w-64 px-4"}
        `}
      >
        {/* ── Mobile header: close + SearchBar ────────────────────────────────── */}
        <div className="lg:hidden mb-5 space-y-3">
          {/* Close button */}
          <div className="flex items-center justify-between">
            <span className="text-2xs font-black uppercase tracking-[0.2em] text-muted/50">Menú</span>
            <AppButton
              type="button"
              isIconOnly
              variant="light"
              disableRipple
              onPress={() => setMobileMenuOpen(false)}
              className="w-9 h-9 min-w-9 rounded-xl text-secondary hover:text-primary hover:bg-white/5"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </AppButton>
          </div>

          {/* SearchBar compacto (píldoras de tipo + input full width) */}
          <SearchBar compact fullWidth />

          <div className="h-px bg-white/[0.05]" />
        </div>

        {/* ── Desktop toggle button ────────────────────────────────────────────── */}
        <AppButton
          type="button"
          isIconOnly
          variant="light"
          disableRipple
          onPress={() => setSidebarExpanded(!sidebarExpanded)}
          className={`hidden lg:flex mb-10 w-11 h-11 min-w-11 rounded-xl text-secondary hover:text-primary hover:bg-white/5
                     ${sidebarExpanded ? "self-end" : ""}`}
          aria-label={sidebarExpanded ? "Contraer barra lateral" : "Expandir barra lateral"}
        >
          {sidebarExpanded ? <ChevronLeft size={22} /> : <Menu size={22} />}
        </AppButton>

        {/* ── Nav ─────────────────────────────────────────────────────────────── */}
        <nav className="flex flex-col gap-2 flex-1 w-full">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <LinkNext
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`relative flex items-center h-12 rounded-xl
                            transition-all duration-200 group
                            ${active
                    ? "bg-green/10 text-green shadow-[inset_0_0_0_1px_rgba(0,224,148,0.2)]"
                    : "text-muted hover:bg-white/[0.03] hover:text-secondary"}
                            ${sidebarExpanded ? "px-4 gap-4" : "lg:justify-center px-4 gap-4"}`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} className="flex-shrink-0" />

                <span className={`text-base font-bold whitespace-nowrap overflow-hidden
                                 block lg:hidden
                                 ${active ? "text-primary" : "text-secondary"}`}>
                  {label}
                </span>
                {sidebarExpanded && (
                  <span className={`hidden lg:block text-base font-bold whitespace-nowrap overflow-hidden
                                   ${active ? "text-primary" : "text-secondary"}`}>
                    {label}
                  </span>
                )}

                {/* Tooltip desktop collapsed */}
                {!sidebarExpanded && (
                  <div className="hidden lg:block absolute left-[calc(100%+15px)] px-3 py-2 rounded-lg bg-primary text-mainBg text-sm font-black
                                  whitespace-nowrap opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 
                                  transition-all duration-200 shadow-2xl z-[100] uppercase tracking-widest border border-white/10">
                    {label}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-primary rotate-45 border-l border-b border-white/10" />
                  </div>
                )}

                {/* Compare Badge */}
                {href === "/compare" && compareList.length > 0 && (
                  <span className={`absolute flex items-center justify-center rounded-full bg-green text-mainBg text-2xs font-black 
                                   shadow-[0_0_10px_rgba(0,224,148,0.3)]
                                   ${sidebarExpanded ? "right-4 w-5 h-5" : "lg:top-1.5 lg:right-1.5 lg:w-4 lg:h-4 right-4 w-5 h-5"}`}>
                    {compareList.length}
                  </span>
                )}

                {/* Favorites Badge */}
                {href === "/shortlist" && favCount > 0 && (
                  <span className={`absolute flex items-center justify-center rounded-full bg-gold text-mainBg text-2xs font-black
                                   shadow-[0_0_10px_rgba(232,168,56,0.35)]
                                   ${sidebarExpanded ? "right-4 w-5 h-5" : "lg:top-1.5 lg:right-1.5 lg:w-4 lg:h-4 right-4 w-5 h-5"}`}>
                    {favCount}
                  </span>
                )}

                {active && sidebarExpanded && (
                  <span className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1 h-6 bg-green rounded-r-full shadow-[2px_0_10px_rgba(0,224,148,0.4)]" />
                )}
              </LinkNext>
            );
          })}
        </nav>

        {/* ── Logout ──────────────────────────────────────────────────────────── */}
        <AppButton
          type="button"
          variant="light"
          disableRipple
          onPress={async () => {
            try {
              await api.post("/auth/logout");
            } catch { /* ignore */ }
            clearAuth();
            window.location.href = "/login";
          }}
          className={`!min-h-12 h-12 w-full rounded-xl justify-start group relative
                     text-muted hover:bg-danger/10 hover:text-danger bg-transparent
                     ${sidebarExpanded ? "px-4 gap-4" : "lg:justify-center px-4 gap-4"}`}
        >
          <LogOut size={18} />
          <span className="text-base font-bold block lg:hidden">Cerrar Sesión</span>
          {sidebarExpanded && <span className="hidden lg:block text-base font-bold">Cerrar Sesión</span>}

          {!sidebarExpanded && (
            <div className="hidden lg:block absolute left-[calc(100%+15px)] px-3 py-2 rounded-lg bg-danger text-primary text-sm font-black
                            whitespace-nowrap opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 
                            transition-all duration-200 shadow-2xl z-[100] uppercase tracking-widest border border-danger/20">
              Cerrar Sesión
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-danger rotate-45" />
            </div>
          )}
        </AppButton>
      </aside>
    </>
  );
}
