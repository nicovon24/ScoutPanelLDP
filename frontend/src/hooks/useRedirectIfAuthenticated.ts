"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useScoutStore } from "@/store/useScoutStore";
import { plainApi } from "@/lib/api";

/**
 * En `/login` y `/register`: si ya hay sesión (token en memoria o cookie de refresh válida),
 * redirige al panel. No usa `_hasHydrated` — token/user no se persisten y el refresh no depende del localStorage.
 */
export function useRedirectIfAuthenticated(): void {
  const router = useRouter();
  const token = useScoutStore((s) => s.token);
  const user = useScoutStore((s) => s.user);
  const setAuth = useScoutStore((s) => s.setAuth);

  useEffect(() => {
    let cancelled = false;

    async function run(): Promise<void> {
      if (token || user) {
        router.replace("/");
        return;
      }
      try {
        const { data } = await plainApi.post<{
          token: string;
          user: { id: number; name: string; email: string };
        }>("/auth/refresh");
        if (cancelled) return;
        setAuth(data.token, data.user);
        router.replace("/");
      } catch {
        // Sin sesión: quedarse en login/register
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [token, user, router, setAuth]);
}
