"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useScoutStore } from "@/store/useScoutStore";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import CompareBar from "@/components/ui/CompareBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, sidebarExpanded } = useScoutStore();

  return (
    <div className="flex min-h-screen bg-mainBg overflow-x-hidden">
      <Sidebar />
      <div className={`flex flex-col flex-1 transition-all duration-300 min-h-screen ${sidebarExpanded ? "ml-64" : "ml-20"}`}>
        <Topbar />
        <main className="flex-1 p-8 w-full">
          {children}
        </main>
        <CompareBar />
      </div>
    </div>
  );
}
