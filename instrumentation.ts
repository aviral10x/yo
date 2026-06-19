import * as Sentry from "@sentry/nextjs";

// Next.js 16 server/edge instrumentation. Only wires Sentry when a DSN is set.
export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? Sentry.captureRequestError
  : undefined;
