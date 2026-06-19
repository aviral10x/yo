// Single project-root client instrumentation file. Next.js allows only ONE, so
// PostHog and Sentry client init are merged here. Each no-ops without its key.
import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-01-30",
  });
}

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.replayIntegration()],
  });
}

// Required for Sentry to instrument App Router client-side navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
