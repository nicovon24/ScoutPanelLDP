import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScoutPanel",
  description: "Plataforma de scouting de jugadores de la Liga Profesional Argentina",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="bg-base text-primary min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
