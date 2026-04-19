"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useScoutStore } from "@/store/useScoutStore";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useScoutStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { email, password, name });
      setAuth(data.token, data.user);
      router.replace("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "Error al registrarse, intentá de nuevo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mainBg flex items-center justify-center p-4 relative overflow-hidden">
      {/* BG glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px]
                      bg-green/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px]
                      bg-purple/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-[300px] h-[300px]
                      bg-blue/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-[360px]">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-green/10 border border-green/20
                          flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
                fill="#00E094" fillOpacity="0.9" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tight">
            ldp<span className="text-green">.</span>
          </h1>
          <p className="text-base text-muted mt-1">Scout Platform · Liga Profesional</p>
        </div>

        {/* Card */}
        <div className="card space-y-4">
          <p className="text-md font-semibold text-primary">Crear cuenta</p>

          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre completo"
                className="field"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="field"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="field pr-10"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
                Confirmar contraseña
              </label>
              <input
                type={showPwd ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí tu contraseña"
                className="field"
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="text-sm text-danger bg-danger/8 border border-danger/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-10 mt-1"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Creando cuenta..." : "Registrarse"}
            </button>
          </form>
        </div>

        {/* Link a login */}
        <div className="flex items-center justify-center gap-2 mt-5">
          <ArrowLeft size={12} className="text-muted" />
          <Link href="/login" className="text-xs text-muted hover:text-secondary transition-colors">
            Ya tenés cuenta · <span className="text-green font-bold">Iniciar sesión</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
