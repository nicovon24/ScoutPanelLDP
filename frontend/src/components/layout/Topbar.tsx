"use client";
import SearchBar from "@/components/ui/SearchBar";
import { useScoutStore } from "@/store/useScoutStore";
import { LogOut, Menu } from "lucide-react";
import Link from "next/link";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg viewBox="0 0 40 40" className="w-full h-full text-green fill-current drop-shadow-[0_0_8px_rgba(0,224,148,0.4)] transition-transform group-hover:scale-110">
          <path d="M20 2L3 11V29L20 38L37 29V11L20 2ZM33.5 12.8V27.2L20 34.5L6.5 27.2V12.8L20 5.5L33.5 12.8Z" />
          <circle cx="20" cy="20" r="6" className="text-primary fill-current" />
          <path d="M18 18L22 18L22 22L18 22L18 18Z" className="text-green fill-current" />
        </svg>
      </div>
      <div className="hidden sm:flex flex-col">
        <span className="text-sm font-black text-primary leading-tight tracking-[0.02em] uppercase">
          ScoutPanel
        </span>
        <span className="text-2xs text-green font-black uppercase tracking-[0.2em] -mt-0.5">Scouting</span>
      </div>
    </Link>
  );
}

export default function Topbar() {
  const { user, clearAuth, mobileMenuOpen, setMobileMenuOpen, sidebarExpanded } = useScoutStore();

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  return (
    <header className={`fixed top-0 right-0 z-[45] bg-mainBg/80 backdrop-blur-xl border-b border-white/[0.04]
                        flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 lg:h-20 gap-3
                        transition-[left] duration-300 left-0
                        ${sidebarExpanded ? "lg:left-64" : "lg:left-20"}`}>

      {/* Left: hamburger (mobile) + branding */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Hamburger — only on mobile/tablet */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center
                     text-secondary hover:text-primary hover:bg-white/5 transition-all"
        >
          <Menu size={20} />
        </button>
        <Logo />
      </div>

      {/* Center: Search — oculto en mobile (está en el sidebar) */}
      <div className="hidden lg:flex justify-center flex-1 min-w-0">
        <SearchBar />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-primary leading-tight">{user?.name ?? "Scout"}</span>
            <span className="text-2xs text-muted uppercase font-black tracking-widest">PRO Account</span>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="w-9 h-9 rounded-xl flex items-center justify-center
                       text-danger hover:bg-danger/10 transition-all border border-danger/10"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
