import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    compress: true,
    reactStrictMode: true,
    allowedDevOrigins: ["192.168.0.162", "localhost", "127.0.0.1"],
    images: {
        formats: ["image/avif", "image/webp"],
        minimumCacheTTL: 60,
    },
};

export default nextConfig;

