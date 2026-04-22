/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async redirects() {
    return [{ source: "/favorites", destination: "/shortlist", permanent: true }];
  },
  // En producción, Next.js actúa como proxy entre el browser y el backend (Render).
  // El browser llama a /api/... en Vercel → Vercel lo reenvía a Render server-side.
  // La cookie queda asociada al dominio de Vercel (first-party) → Safari/Brave no la bloquean.
  // En dev no se configura nada: NEXT_PUBLIC_API_URL apunta directamente a localhost:4000.
  async rewrites() {
    const backendUrl = process.env.BACKEND_PROXY_URL;
    if (!backendUrl) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "assets.sorare.com" },
      { protocol: "https", hostname: "elintransigente.com" },
      { protocol: "https", hostname: "img.a.transfermarkt.technology" },
      { protocol: "https", hostname: "media.tycsports.com" },
      { protocol: "https", hostname: "images.fotmob.com" },
      { protocol: "https", hostname: "www.corrienteshoy.com" },
    ],
  },
};

export default nextConfig;
