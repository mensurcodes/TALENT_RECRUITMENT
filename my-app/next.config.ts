import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
  experimental: {
    serverActions: {
      /** Video answer clips for Whisper transcription */
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
