import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScoutPanel",
  description: "Plataforma de scouting de jugadores de la Liga Profesional Argentina",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
