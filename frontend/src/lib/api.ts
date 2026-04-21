import axios from "axios";
import toast from "react-hot-toast";
import { useScoutStore } from "@/store/useScoutStore";

/** Evita múltiples logout / toasts / redirects si varios requests devuelven 401 a la vez */
let handlingSessionExpired = false;

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
  withCredentials: true,
});

// JWT: header Bearer (memoria) o cookie httpOnly que el backend setea en login/register
api.interceptors.request.use((config) => {
  const token = useScoutStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window === "undefined") return Promise.reject(error);

    const status = error.response?.status;
    const path = window.location.pathname;
    const reqUrl = String(error.config?.url ?? "");

    if (status === 401) {
      // Bootstrap de sesión (layout) o logout: no redirigir ni limpiar aquí
      if (reqUrl.includes("/auth/me") || reqUrl.includes("/auth/logout")) {
        return Promise.reject(error);
      }
      if (path !== "/login" && path !== "/register") {
        if (!handlingSessionExpired) {
          handlingSessionExpired = true;
          void api.post("/auth/logout").catch(() => {});
          useScoutStore.getState().clearAuth();
          toast.error("Tu sesión expiró. Iniciá sesión nuevamente.", {
            id: "app-axios-session",
          });
          setTimeout(() => {
            window.location.href = "/login";
            handlingSessionExpired = false;
          }, 800);
        }
      }
    } else if (!status || status >= 500) {
      if (path !== "/login" && path !== "/register") {
        toast.error("Error inesperado. Intentá de nuevo.", { id: "app-axios-server" });
      }
    }

    return Promise.reject(error);
  },
);

export default api;
