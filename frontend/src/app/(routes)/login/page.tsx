"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Input } from "@nextui-org/react";
import api from "@/lib/api";
import { useScoutStore } from "@/store/useScoutStore";
import AppButton from "@/components/ui/AppButton";
import { authInputClassNames } from "@/components/ui/sharedStyles";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useScoutStore();
  const [email, setEmail] = useState("demo@gmail.com");
  const [password, setPassword] = useState("123456");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Ingresá tu email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error("El email no tiene un formato válido"); return; }
    if (!password) { toast.error("Ingresá tu contraseña"); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setAuth(data.token, data.user);
      router.replace("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? "Credenciales incorrectas";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mainBg flex items-center justify-center p-6 relative overflow-hidden">

      {/* ── Decoración: campo de fútbol ── */}
      <div className="pointer-events-none select-none">
        <div className="fixed inset-x-0 top-1/2 h-px bg-green/[0.045]" />
        <div
          className="fixed rounded-full border border-green/[0.06]"
          style={{ width: 420, height: 420, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
        />
        <div
          className="fixed rounded-full border border-green/[0.10]"
          style={{ width: 80, height: 80, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
        />
        <span
          className="fixed top-[-12px] left-[-6px] font-black text-green/[0.035] leading-none"
          style={{ fontSize: 180, fontFamily: "'Nunito Sans', sans-serif", letterSpacing: "-4px" }}
        >
          1
        </span>
        <span
          className="fixed bottom-[-12px] right-[-6px] font-black text-green/[0.035] leading-none"
          style={{ fontSize: 180, fontFamily: "'Nunito Sans', sans-serif", letterSpacing: "-4px" }}
        >
          1
        </span>
        <div
          className="fixed inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="fixed top-[18%] left-[-5%] w-[320px] h-[320px] rounded-full bg-green/[0.07] blur-[90px] pointer-events-none" />
      <div className="fixed bottom-[8%] right-[4%] w-[260px] h-[260px] rounded-full bg-blue/[0.05] blur-[80px] pointer-events-none" />

      <motion.div
        className="relative z-10 w-full max-w-[600px] flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col items-center gap-3">
          <svg viewBox="0 0 40 40" className="w-14 h-14 text-green fill-current drop-shadow-[0_0_16px_rgba(0,224,148,0.35)]">
            <path d="M20 2L3 11V29L20 38L37 29V11L20 2ZM33.5 12.8V27.2L20 34.5L6.5 27.2V12.8L20 5.5L33.5 12.8Z" />
            <circle cx="20" cy="20" r="6" fill="#F2F2F2" />
            <path d="M18 18L22 18L22 22L18 22L18 18Z" fill="#00E094" />
          </svg>
          <div className="flex flex-col items-center gap-0.5">
            <h1 className="text-[28px] font-black text-primary tracking-[2px] leading-none uppercase">
              ScoutPanel
            </h1>
            <p className="text-xs font-black text-green tracking-[3px] uppercase">
              Scouting Panel
            </p>
          </div>
        </div>

        <div
          className="w-full rounded-xl p-8 relative overflow-hidden"
          style={{
            background: "rgba(28, 28, 28, 0.6)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(0,224,148,0.35), transparent)" }}
          />

          <h2 className="text-2xl font-black text-primary tracking-[2px] uppercase mb-6">
            Iniciar <span className="text-green">sesión</span>
          </h2>

          <form onSubmit={handleLogin} noValidate className="space-y-8 pt-2">
            <Input
              label="Email"
              labelPlacement="outside"
              type="email"
              value={email}
              onValueChange={setEmail}
              placeholder="demo@gmail.com"
              autoComplete="email"
              variant="bordered"
              classNames={authInputClassNames}
            />

            <Input
              label="Contraseña"
              labelPlacement="outside"
              type={showPwd ? "text" : "password"}
              value={password}
              onValueChange={setPassword}
              placeholder="••••••••"
              autoComplete="current-password"
              variant="bordered"
              classNames={{ ...authInputClassNames}}
              endContent={
                <AppButton
                  type="button"
                  isIconOnly
                  variant="light"
                  radius="full"
                  className="text-muted hover:text-secondary -mr-1"
                  onPress={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </AppButton>
              }
            />

            <AppButton
              type="submit"
              variant="gradient"
              disabled={loading}
              className="w-full mt-2 h-12 rounded-xl font-black uppercase tracking-[2.5px] text-sm"
            >
              <span
                className="absolute top-0 left-[-100%] w-[60%] h-full group-hover:left-[160%] transition-[left] duration-500 pointer-events-none"
                style={{ background: "rgba(255,255,255,0.18)", transform: "skewX(-20deg)" }}
              />
              <span className="relative flex items-center justify-center gap-2">
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? "Ingresando..." : "Ingresar"}
              </span>
            </AppButton>
          </form>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <UserPlus size={12} />
            <span>¿No tenés cuenta?</span>
            <Link href="/register" className="text-green font-bold hover:underline transition-all">
              Registrarse
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
