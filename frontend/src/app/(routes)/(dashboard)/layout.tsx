"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useScoutStore } from "@/store/useScoutStore";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, user, sidebarExpanded, _hasHydrated, setAuth } = useScoutStore();
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (token || user) {
      setSessionChecked(true);
      return;
    }

    api
      .post("/auth/refresh")
      .then(({ data }) => {
        setAuth(data.token, data.user);
      })
      .catch(() => {
        /* sin cookie de refresh válida */
      })
      .finally(() => {
        setSessionChecked(true);
      });
  }, [_hasHydrated, token, user, setAuth]);

  useEffect(() => {
    if (!_hasHydrated || !sessionChecked) return;
    if (!token && !user) {
      router.replace("/login");
    }
  }, [_hasHydrated, sessionChecked, token, user, router]);

  if (!_hasHydrated || !sessionChecked) {
    return (
      <div className="flex min-h-screen bg-mainBg items-center justify-center">
        <div className="w-10 h-10 border-4 border-green/30 border-t-green rounded-full animate-spin" />
      </div>
    );
  }

  if (!token && !user) return null;

  return (
    <div className="flex min-h-screen bg-mainBg ">
      <Sidebar />
      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 min-h-screen ml-0 ${sidebarExpanded ? "lg:ml-64" : "lg:ml-20"}`}>
        <Topbar />
        <div className="h-16 lg:h-20 flex-shrink-0" />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
