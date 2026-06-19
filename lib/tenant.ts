import { eq } from "drizzle-orm";

import { getDb, schema } from "@/lib/db";

export type Venue = typeof schema.venues.$inferSelect;

/**
 * Resolve a tenant venue from the proxy-derived host key. A subdomain label has
 * no dot and is matched against `slug`; a full custom domain has a dot and is
 * matched against `customDomain`. Matching the single correct column (rather
 * than an OR across both) removes the slug/customDomain namespace-overlap
 * ambiguity. Returns null if not found or the DB is not configured.
 */
export async function resolveVenue(hostOrSlug: string): Promise<Venue | null> {
  if (!process.env.DATABASE_URL) return null;
  const isCustomDomain = hostOrSlug.includes(".");
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.venues)
      .where(
        isCustomDomain
          ? eq(schema.venues.customDomain, hostOrSlug)
          : eq(schema.venues.slug, hostOrSlug),
      )
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}
