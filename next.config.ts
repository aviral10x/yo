import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

// Allow Next/Image to optimize media served from the R2 public bucket.
function r2Hostname(): string | null {
  const url = process.env.R2_PUBLIC_BASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const host = r2Hostname();

const nextConfig: NextConfig = {
  // Pin the workspace root — a stray lockfile in a parent dir otherwise makes
  // Turbopack infer the wrong root.
  turbopack: { root: __dirname },
  images: {
    remotePatterns: [
      // Stock imagery for demo venue sites (real venue photos replace these).
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(host ? [{ protocol: "https" as const, hostname: host }] : []),
    ],
  },
};

// Only wrap with Sentry when a DSN is present, so local/CI builds stay clean.
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
    })
  : nextConfig;
