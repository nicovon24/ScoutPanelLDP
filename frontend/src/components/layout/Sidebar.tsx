"use client";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Star, LogOut, Menu, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useScoutStore } from "@/store/useScoutStore";
import LinkNext from "next/link";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Inicio" },
  { href: "/compare", icon: BarChart2, label: "Comparar" },
  { href: "/favorites", icon: Star, label: "Favoritos" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const {
    compareList, clearAuth,
    sidebarExpanded, setSidebarExpanded,
    token, shortlistIds, favorites,
    mobileMenuOpen, setMobileMenuOpen,
  } = useScoutStore();
  const favCount = token ? shortlistIds.length : favorites.length;

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
          /* Mobile: drawer off-screen when closed */
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          /* Desktop (lg+): always visible, use sidebarExpanded for width */
          lg:translate-x-0
          ${sidebarExpanded ? "w-64 px-4" : "lg:w-20 lg:px-3 lg:items-center w-64 px-4"}
        `}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="mb-6 self-end w-9 h-9 rounded-xl flex items-center justify-center
                     text-secondary hover:text-primary hover:bg-white/5 transition-all lg:hidden"
        >
          <X size={18} />
        </button>

        {/* Desktop toggle button */}
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className={`hidden lg:flex mb-10 w-11 h-11 rounded-xl items-center justify-center
                     text-secondary hover:text-primary hover:bg-white/5 transition-all
                     ${sidebarExpanded ? "self-end" : ""}`}
        >
          {sidebarExpanded ? <ChevronLeft size={22} /> : <Menu size={22} />}
        </button>

        {/* Nav */}
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

                {/* Label: always visible on mobile, only when expanded on desktop */}
                <span className={`text-base font-bold whitespace-nowrap overflow-hidden transition-all duration-300
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

                {/* Tooltip (desktop collapsed only) */}
                {!sidebarExpanded && (
                  <div className="hidden lg:block absolute left-[calc(100%+15px)] px-3 py-2 rounded-lg bg-primary text-mainBg text-sm font-black
                                  whitespace-nowrap opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 
                                  transition-all duration-200 shadow-2xl z-[100] uppercase tracking-widest border border-white/10">
                    {label}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-primary rotate-45 border-l border-b border-white/10" />
                  </div>
                )}

                {/* Compare Badge */}
                {label === "Comparar" && compareList.length > 0 && (
                  <span className={`absolute flex items-center justify-center rounded-full bg-green text-mainBg text-2xs font-black 
                                   shadow-[0_0_10px_rgba(0,224,148,0.3)]
                                   ${sidebarExpanded ? "right-4 w-5 h-5" : "lg:top-1.5 lg:right-1.5 lg:w-4 lg:h-4 right-4 w-5 h-5"}`}>
                    {compareList.length}
                  </span>
                )}

                {/* Favorites Badge */}
                {label === "Favoritos" && favCount > 0 && (
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

        {/* Logout */}
        <button
          onClick={() => { clearAuth(); window.location.href = "/login"; }}
          className={`w-full h-12 rounded-xl flex items-center transition-all group relative
                     text-muted hover:bg-danger/10 hover:text-danger
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
        </button>
      </aside>
    </>
  );
}
