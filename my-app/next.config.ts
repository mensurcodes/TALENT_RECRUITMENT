import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(appRoot, "..");

const nextConfig: NextConfig = {
  /**
   * npm workspaces hoists all deps (tailwindcss, picocolors, pdf-parse…) to the
   * repo root node_modules. Turbopack must start resolution from there, not from
   * my-app/, otherwise transitive deps that were hoisted cannot be found.
   */
  turbopack: {
    root: monorepoRoot,
  },
  /** Common mistaken URLs — applicant routes live under /applicant/… */
  async redirects() {
    return [
      { source: "/jobs", destination: "/applicant/jobs", permanent: false },
      { source: "/jobs/:path*", destination: "/applicant/jobs/:path*", permanent: false },
      { source: "/login", destination: "/applicant", permanent: false },
      { source: "/applicant/login", destination: "/applicant", permanent: false },
    ];
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
