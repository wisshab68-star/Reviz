import type { NextConfig } from "next";

const nextConfig: NextConfig & { swcMinify: true } = {
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
