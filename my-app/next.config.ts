import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      /** Video answer clips for Whisper transcription */
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
