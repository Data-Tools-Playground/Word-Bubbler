import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed 'output: export' to allow API routes for live WebSocket functionality
  // Keep other static-friendly configs for deployment flexibility
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
