import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The home directory is itself a git repo with its own lockfile; pin the
  // Turbopack root to this project so Next stops inferring the wrong root.
  turbopack: {
    root: path.join(__dirname),
  },
  // dev-only: lets a phone on the LAN load HMR resources when testing via the
  // network URL (production is unaffected)
  allowedDevOrigins: ["10.188.96.141", "192.168.9.3"],
};

export default nextConfig;
