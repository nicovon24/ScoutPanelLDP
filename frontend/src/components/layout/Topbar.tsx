"use client";
import SearchBar from "@/components/ui/SearchBar";
import { useScoutStore } from "@/store/useScoutStore";
import { LogOut, Bell } from "lucide-react";
import Link from "next/link";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <div className="relative w-9 h-9 flex items-center justify-center">
        {/* LDP Hexagon Logo Placeholder */}
        <svg viewBox="0 0 40 40" className="w-full h-full text-green fill-current drop-shadow-[0_0_8px_rgba(0,224,148,0.4)] transition-transform group-hover:scale-110">
          <path d="M20 2L3 11V29L20 38L37 29V11L20 2ZM33.5 12.8V27.2L20 34.5L6.5 27.2V12.8L20 5.5L33.5 12.8Z" />
          <circle cx="20" cy="20" r="6" className="text-primary fill-current" />
          <path d="M18 18L22 18L22 22L18 22L18 18Z" className="text-green fill-current" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-md font-black text-primary leading-tight tracking-[0.02em] uppercase">
          librodepases
        </span>
        <span className="text-2xs text-green font-black uppercase tracking-[0.2em] -mt-0.5">Scouting Panel</span>
      </div>
    </Link>
  );
}

export default function Topbar() {
  const { user } = useScoutStore();

  return (
    <header className="sticky top-0 z-40 bg-mainBg/80 backdrop-blur-xl border-b border-white/[0.04]
                       flex items-center justify-between px-8 h-20">

      {/* Left: Branding */}
      <div className="w-1/4 flex-shrink-0">
        <Logo />
      </div>

      {/* Center: Search — centered */}
      <div className="flex justify-center flex-1">
        <SearchBar />
      </div>

      {/* Right actions */}
      <div className="w-1/4 flex items-center justify-end gap-5 flex-shrink-0">
        {/* User / Logout */}
        <div className="flex items-center gap-3 pl-3">
          <div className="flex flex-col items-end">
            <span className="text-base font-bold text-primary">{user?.name ?? "Scout"}</span>
            <span className="text-2xs text-muted uppercase font-black tracking-widest">PRO Account</span>
          </div>
          <button className="w-10 h-10 rounded-xl flex items-center justify-center
                             text-danger hover:bg-danger/10 transition-all border border-danger/10">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
