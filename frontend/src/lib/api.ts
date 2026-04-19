import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
});

// Inyectar el JWT en cada request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("scout_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Si el token expiró, redirigir al login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    /* 
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("scout_token");
      localStorage.removeItem("scout_user");
      window.location.href = "/login";
    }
    */
    return Promise.reject(error);
  }
);

export default api;
