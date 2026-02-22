import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
  //swcMinify: true,
};

export default nextConfig;
