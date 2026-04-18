"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useScoutStore } from "@/store/useScoutStore";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import CompareBar from "@/components/ui/CompareBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token } = useScoutStore();

  /* 
  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  if (!token) return null; 
  */

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-16 min-h-screen">
        <Topbar />
        <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
        <CompareBar />
      </div>
    </div>
  );
}
