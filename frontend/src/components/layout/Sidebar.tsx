"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BarChart2, Star, LogOut } from "lucide-react";
import { useScoutStore } from "@/store/useScoutStore";

const NAV_ITEMS = [
  { href: "/",          icon: Home,     label: "Home" },
  { href: "/players",   icon: Users,    label: "Jugadores" },
  { href: "/compare",   icon: BarChart2, label: "Comparar" },
  { href: "/favorites", icon: Star,     label: "Favoritos" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { compareList, clearAuth } = useScoutStore();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-16 bg-sidebar border-r border-border
                      flex flex-col items-center py-4 z-50">
      {/* Logo mark */}
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-7
                      bg-green/10 border border-green/25">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
                fill="#00E094" fillOpacity="0.9"/>
        </svg>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1 w-full px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`relative flex items-center justify-center w-full h-10 rounded-lg
                          transition-all duration-150 group
                          ${active
                            ? "bg-green/12 text-green"
                            : "text-muted hover:bg-card-2 hover:text-secondary"}`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {/* Active indicator */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5
                                 bg-green rounded-r-full" />
              )}
              {/* Compare badge */}
              {label === "Comparar" && compareList.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full
                                 bg-green text-base text-[9px] font-bold
                                 flex items-center justify-center leading-none">
                  {compareList.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        title="Cerrar sesión"
        onClick={() => { clearAuth(); window.location.href = "/login"; }}
        className="w-10 h-10 rounded-lg flex items-center justify-center
                   text-muted hover:bg-danger/10 hover:text-danger transition-all"
      >
        <LogOut size={16} />
      </button>
    </aside>
  );
}
