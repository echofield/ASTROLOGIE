import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The home directory is itself a git repo with its own lockfile; pin the
  // Turbopack root to this project so Next stops inferring the wrong root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
