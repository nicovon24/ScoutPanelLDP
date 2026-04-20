import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { useScoutStore } from "@/store/useScoutStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
});

// Inyectar el JWT — lee del store (en memoria) o de la cookie como fallback
api.interceptors.request.use((config) => {
  const token = useScoutStore.getState().token ?? Cookies.get("accessToken") ?? null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el token expiró, limpiar sesión y redirigir al login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window === "undefined") return Promise.reject(error);

    const status = error.response?.status;
    const path = window.location.pathname;

    if (status === 401) {
      if (path !== "/login" && path !== "/register") {
        useScoutStore.getState().clearAuth();
        toast.error("Tu sesión expiró. Iniciá sesión nuevamente.");
        setTimeout(() => { window.location.href = "/login"; }, 800);
      }
    } else if (status === 429) {
      toast.error("Demasiados intentos. Esperá unos minutos.");
    } else if (!status || status >= 500) {
      // Solo mostrar toast genérico si no hay un handler local (ej. login/register tienen el suyo)
      if (path !== "/login" && path !== "/register") {
        toast.error("Error inesperado. Intentá de nuevo.");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
