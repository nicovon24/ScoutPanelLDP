"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useScoutStore } from "@/store/useScoutStore";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useScoutStore();
  const [email, setEmail]       = useState("demo@gmail.com");
  const [password, setPassword] = useState("123456");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setAuth(data.token, data.user);
      router.replace("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "Credenciales incorrectas");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4 relative overflow-hidden">
      {/* BG glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px]
                      bg-green/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px]
                      bg-blue/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[300px] h-[300px]
                      bg-purple/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-[360px]">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-green/10 border border-green/20
                          flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
                    fill="#00E094" fillOpacity="0.9"/>
            </svg>
          </div>
          <h1 className="text-[26px] font-black text-primary tracking-tight">
            ldp<span className="text-green">.</span>
          </h1>
          <p className="text-[13px] text-muted mt-1">Scout Platform · Liga Profesional</p>
        </div>

        {/* Card */}
        <div className="card space-y-4">
          <p className="text-[15px] font-semibold text-primary">Iniciar sesión</p>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field" required autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1.5 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field pr-10" required autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-[12px] text-danger bg-danger/8 border border-danger/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
                    className="btn btn-primary w-full h-10 mt-1">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="text-center text-[11px] text-muted pt-1">
            Sesión válida por <span className="text-secondary">7 días</span>
          </p>
        </div>

        {/* Demo badge */}
        <div className="flex items-center justify-center gap-2 mt-5">
          <span className="badge badge-green text-[10px]">DEMO</span>
          <span className="text-[11px] text-muted">Credenciales pre-cargadas</span>
        </div>
      </div>
    </div>
  );
}
