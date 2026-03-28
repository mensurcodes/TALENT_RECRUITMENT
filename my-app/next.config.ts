import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(appRoot, "..");

const nextConfig: NextConfig = {
  /** Hoisted workspace deps (e.g. pdf-parse) live in the repo root node_modules */
  turbopack: {
    root: monorepoRoot,
  },
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  experimental: {
    serverActions: {
      /** Video answer clips for Whisper transcription */
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
