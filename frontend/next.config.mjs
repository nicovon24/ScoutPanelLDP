/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
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
