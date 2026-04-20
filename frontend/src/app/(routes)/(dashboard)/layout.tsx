"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useScoutStore } from "@/store/useScoutStore";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, sidebarExpanded, _hasHydrated } = useScoutStore();

  useEffect(() => {
    if (_hasHydrated && !token) {
      router.replace("/login");
    }
  }, [_hasHydrated, token, router]);

  if (!_hasHydrated) {
    return (
      <div className="flex min-h-screen bg-mainBg items-center justify-center">
        <div className="w-10 h-10 border-4 border-green/30 border-t-green rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-mainBg ">
      <Sidebar />
      {/* min-w-0: permite que overflow-x-auto de tablas reciba ancho acotado al viewport (flex default min-width:auto lo bloquea) */}
      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 min-h-screen ml-0 ${sidebarExpanded ? "lg:ml-64" : "lg:ml-20"}`}>
        <Topbar />
        {/* Spacer that matches the fixed topbar height so content is not hidden beneath it */}
        <div className="h-16 lg:h-20 flex-shrink-0" />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
