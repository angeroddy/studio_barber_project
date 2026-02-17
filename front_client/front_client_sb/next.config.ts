import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const defaultImageOrigins = [
  "https://deifkwefumgah.cloudfront.net",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
];
const configuredImageOrigins = (process.env.NEXT_PUBLIC_ALLOWED_IMAGE_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const imageOrigins = configuredImageOrigins.length > 0 ? configuredImageOrigins : defaultImageOrigins;
const remotePatterns = buildImageRemotePatterns(imageOrigins);

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;

function buildImageRemotePatterns(origins: string[]) {
  const patterns = origins
    .map((origin) => {
      try {
        const url = new URL(origin);
        if (url.hostname.includes("*")) {
          return null;
        }

        const pattern = {
          protocol: url.protocol.replace(":", "") as "http" | "https",
          hostname: url.hostname,
        };

        if (url.port) {
          return { ...pattern, port: url.port };
        }

        return pattern;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Array<{ protocol: "http" | "https"; hostname: string; port?: string }>;

  if (patterns.length === 0) {
    return [
      {
        protocol: "https" as const,
        hostname: "deifkwefumgah.cloudfront.net",
      },
    ];
  }

  const dedup = new Map<string, { protocol: "http" | "https"; hostname: string; port?: string }>();
  for (const pattern of patterns) {
    dedup.set(`${pattern.protocol}://${pattern.hostname}:${pattern.port ?? ""}`, pattern);
  }

  return Array.from(dedup.values());
}
