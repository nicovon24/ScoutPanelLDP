import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ScoutPanelLDP",
    template: "%s | ScoutPanelLDP",
  },
  description: "Plataforma de scouting de jugadores de la Liga Profesional Argentina",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="bg-mainBg text-primary min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
