import { PostHog } from "posthog-node";

/**
 * Server-side PostHog client for Server Components / Route Handlers / Server
 * Actions. flushAt:1 + flushInterval:0 send immediately; you MUST
 * `await client.shutdown()` after use or events are dropped when the function
 * freezes. Returns null when PostHog isn't configured.
 */
export function getPostHogServer(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  return new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
}
