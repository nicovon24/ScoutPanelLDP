import axios, { type InternalAxiosRequestConfig } from "axios";
import toast from "react-hot-toast";
import { useScoutStore } from "@/store/useScoutStore";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

/** Evita múltiples refresh en paralelo; las demás esperan el mismo resultado. */
let isRefreshing = false;

type RefreshWaiter = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig;
};

let refreshWaiters: RefreshWaiter[] = [];

function flushRefreshSuccess(token: string): void {
  const waiters = refreshWaiters;
  refreshWaiters = [];
  for (const w of waiters) {
    w.config.headers.Authorization = `Bearer ${token}`;
    w.resolve(api(w.config));
  }
}

function flushRefreshFailure(reason: unknown): void {
  const waiters = refreshWaiters;
  refreshWaiters = [];
  for (const w of waiters) {
    w.reject(reason);
  }
}

/**
 * Instancia sin interceptor de respuesta usada exclusivamente para la llamada
 * a /auth/refresh, evitando bucles infinitos de 401.
 */
const plainApi = axios.create({ baseURL: BASE_URL, withCredentials: true });

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Adjunta el access token en memoria como Bearer en cada request
api.interceptors.request.use((config) => {
  const token = useScoutStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (typeof window === "undefined") return Promise.reject(error);

    const status = error.response?.status;
    const reqUrl = String(error.config?.url ?? "");
    const path = window.location.pathname;

    if (status === 401) {
      // Rutas de auth y logout no deben reintentar (evita bucles)
      if (
        reqUrl.includes("/auth/refresh") ||
        reqUrl.includes("/auth/logout") ||
        reqUrl.includes("/auth/me")
      ) {
        return Promise.reject(error);
      }

      // Si ya hay un refresh en curso, encolar el reintento (éxito o fallo del líder)
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshWaiters.push({ resolve, reject, config: error.config });
        });
      }

      isRefreshing = true;

      try {
        const { data } = await plainApi.post<{ token: string; user: { id: number; name: string; email: string } }>(
          "/auth/refresh"
        );
        useScoutStore.getState().setAuth(data.token, data.user);

        // Reintentar el request original con el nuevo token
        error.config.headers.Authorization = `Bearer ${data.token}`;
        const leaderResult = api(error.config);
        flushRefreshSuccess(data.token);
        return leaderResult;
      } catch (refreshErr) {
        // El refresh falló: desbloquear cola, limpiar sesión y redirigir
        flushRefreshFailure(refreshErr);
        useScoutStore.getState().clearAuth();
        if (path !== "/login" && path !== "/register") {
          toast.error("Tu sesión expiró. Iniciá sesión nuevamente.", {
            id: "app-axios-session",
          });
          setTimeout(() => {
            window.location.href = "/login";
          }, 800);
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    if (!status || status >= 500) {
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        toast.error("Error inesperado. Intentá de nuevo.", { id: "app-axios-server" });
      }
    }

    return Promise.reject(error);
  },
);

export default api;
export { plainApi };
