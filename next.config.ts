import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (there is another lockfile in the home folder).
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
