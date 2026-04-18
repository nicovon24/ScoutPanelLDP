"use client";
import { Bell } from "lucide-react";
import SearchBar from "@/components/ui/SearchBar";
import { useScoutStore } from "@/store/useScoutStore";

export default function Topbar() {
  const { user } = useScoutStore();

  return (
    <header className="sticky top-0 z-40 bg-sidebar/90 backdrop-blur-md border-b border-border
                       flex items-center gap-4 px-6 h-14">
      {/* Brand */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[15px] font-bold tracking-tight">
          <span className="text-primary">ldp</span>
          <span className="text-green">.</span>
        </span>
      </div>

      {/* Search — centered */}
      <div className="flex-1 max-w-lg mx-auto">
        <SearchBar />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center
                           text-muted hover:text-secondary hover:bg-card-2 transition-all">
          <Bell size={15} />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center
                        bg-green/15 border border-green/25 text-green text-xs font-bold">
          {user?.name?.[0]?.toUpperCase() ?? "S"}
        </div>
      </div>
    </header>
  );
}
