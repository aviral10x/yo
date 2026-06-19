/** Cross-surface URL helpers for the multi-tenant host layout. */
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "lvh.me:3000";

const isLocal = ROOT_DOMAIN.includes("localhost") || ROOT_DOMAIN.includes("lvh.me");
export const PROTOCOL = isLocal ? "http" : "https";

/** The owner dashboard, served on app.<root>. */
export const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? `${PROTOCOL}://app.${ROOT_DOMAIN}`;

/** Public website for a venue served on its subdomain. */
export function venueUrl(slug: string): string {
  return `${PROTOCOL}://${slug}.${ROOT_DOMAIN}`;
}

/** The marketing site root. */
export const marketingUrl = `${PROTOCOL}://${ROOT_DOMAIN}`;
