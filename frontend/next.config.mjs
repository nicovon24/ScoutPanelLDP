/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async redirects() {
    return [{ source: "/favorites", destination: "/shortlist", permanent: true }];
  },
  // En producción, Next.js funciona como "puente" entre el frontend y la API.
  // El navegador siempre llama a /api/... en el mismo dominio del frontend.
  // Luego Next (en Vercel) reenvía esa llamada al backend real (ej. Render) desde el servidor.
  // Resultado: las cookies se manejan como first-party y se evitan bloqueos típicos de Safari/Brave.
  // En desarrollo no usamos este proxy: NEXT_PUBLIC_API_URL apunta directo a http://localhost:4000/api.
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
