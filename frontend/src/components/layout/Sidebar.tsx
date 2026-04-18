"use client";
import Link from "next/navigation";
import { usePathname } from "next/navigation";
import { Home, Users, BarChart2, Star, LogOut, Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { useScoutStore } from "@/store/useScoutStore";
import LinkNext from "next/link";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Inicio" },
  { href: "/compare", icon: BarChart2, label: "Comparar" },
  { href: "/favorites", icon: Star, label: "Favoritos" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { compareList, clearAuth, sidebarExpanded, setSidebarExpanded } = useScoutStore();

  return (
    <aside className={`fixed left-0 top-0 bottom-0 bg-[#0A0A0A] border-r border-white/[0.05]
                      flex flex-col py-6 z-[80] transition-all duration-300 ease-in-out
                      ${sidebarExpanded ? "w-64 px-4" : "w-20 px-3 items-center"}`}>

      {/* Toggle Button */}
      <button
        onClick={() => setSidebarExpanded(!sidebarExpanded)}
        className={`mb-10 w-11 h-11 rounded-xl flex items-center justify-center
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
              className={`relative flex items-center h-12 rounded-xl
                          transition-all duration-200 group
                          ${active
                  ? "bg-green/10 text-green shadow-[inset_0_0_0_1px_rgba(0,224,148,0.2)]"
                  : "text-muted hover:bg-white/[0.03] hover:text-secondary"}
                          ${sidebarExpanded ? "px-4 gap-4" : "justify-center"}`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} className="flex-shrink-0" />

              {sidebarExpanded && (
                <span className={`text-[14px] font-bold whitespace-nowrap overflow-hidden transition-all duration-300
                                 ${active ? "text-primary" : "text-secondary"}`}>
                  {label}
                </span>
              )}

              {/* Tooltip (only when collapsed) */}
              {!sidebarExpanded && (
                <div className="absolute left-[calc(100%+15px)] px-3 py-2 rounded-lg bg-primary text-base text-[12px] font-black
                                whitespace-nowrap opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 
                                transition-all duration-200 shadow-2xl z-[100] uppercase tracking-widest border border-white/10">
                  {label}
                  {/* Arrow */}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-primary rotate-45 border-l border-b border-white/10" />
                </div>
              )}

              {/* Compare Badge */}
              {label === "Comparar" && compareList.length > 0 && (
                <span className={`absolute flex items-center justify-center rounded-full bg-green text-base text-[10px] font-black 
                                 shadow-[0_0_10px_rgba(0,224,148,0.3)]
                                 ${sidebarExpanded ? "right-4 w-5 h-5" : "top-1.5 right-1.5 w-4 h-4"}`}>
                  {compareList.length}
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
                   ${sidebarExpanded ? "px-4 gap-4" : "justify-center"}`}
      >
        <LogOut size={18} />
        {sidebarExpanded && <span className="text-[14px] font-bold">Cerrar Sesión</span>}

        {!sidebarExpanded && (
          <div className="absolute left-[calc(100%+15px)] px-3 py-2 rounded-lg bg-danger text-white text-[12px] font-black
                          whitespace-nowrap opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 
                          transition-all duration-200 shadow-2xl z-[100] uppercase tracking-widest border border-danger/20">
            Cerrar Sesión
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-danger rotate-45" />
          </div>
        )}
      </button>
    </aside>
  );
}
