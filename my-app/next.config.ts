import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(appRoot, "..");

const nextConfig: NextConfig = {
  /**
   * npm workspaces hoist deps to the repo root. Point Turbopack at the monorepo root so hoisted
   * packages (pdf-parse, tailwindcss, etc.) resolve. Root `package.json` lists shared tooling deps.
   */
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
