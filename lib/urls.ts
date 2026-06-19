/** Cross-surface URL helpers — work in both HOST mode (subdomains) and PATH
 *  mode (single domain, e.g. *.vercel.app). See proxy.ts. */
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "lvh.me:3000";

const isLocal = ROOT_DOMAIN.includes("localhost") || ROOT_DOMAIN.includes("lvh.me");
export const PROTOCOL = isLocal ? "http" : "https";

/** Single-domain path routing: dashboard at /dashboard, venue sites at /s/<slug>
 *  on ONE host. Auto-on for *.vercel.app (no wildcard subdomains) or via
 *  NEXT_PUBLIC_PATH_ROUTING=1. Off for a real wildcard domain. */
export const PATH_ROUTING =
  process.env.NEXT_PUBLIC_PATH_ROUTING === "1" ||
  ROOT_DOMAIN.includes("vercel.app");

/** The owner dashboard. */
export const appUrl = PATH_ROUTING
  ? "/dashboard"
  : (process.env.NEXT_PUBLIC_APP_URL ?? `${PROTOCOL}://app.${ROOT_DOMAIN}`);

/** Public website for a venue. */
export function venueUrl(slug: string): string {
  return PATH_ROUTING ? `/s/${slug}` : `${PROTOCOL}://${slug}.${ROOT_DOMAIN}`;
}

/** The marketing site root. */
export const marketingUrl = PATH_ROUTING ? "/" : `${PROTOCOL}://${ROOT_DOMAIN}`;
