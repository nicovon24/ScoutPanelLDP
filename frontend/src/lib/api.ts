import axios from "axios";
import Cookies from "js-cookie";
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
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        // Limpia el localStorage como el estado persistido de Zustand,
        useScoutStore.getState().clearAuth();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
