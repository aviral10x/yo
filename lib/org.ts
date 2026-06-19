import "server-only";

import { sql } from "drizzle-orm";

import { getAuthContext } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";

export type Org = typeof schema.organizations.$inferSelect;

export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

/**
 * Ensure an `organizations` row (and the current user + membership) exists for
 * the active Clerk organization, then return it. Returns null when the DB or
 * Clerk org isn't available — callers render demo/empty states in that case.
 *
 * This is the tenant-resolution boundary: downstream queries scope on the
 * returned `org.id` (NEVER a client-supplied id). See IMPLEMENTATION_PLAN §3.
 */
export async function getActiveOrg(): Promise<Org | null> {
  if (!isDbConfigured()) return null;
  const { configured, userId, orgId, orgSlug } = await getAuthContext();
  if (!configured || !userId || !orgId) return null;

  try {
    const db = getDb();
    const [org] = await db
      .insert(schema.organizations)
      .values({ clerkOrgId: orgId, name: orgSlug ?? "My venue" })
      .onConflictDoUpdate({
        target: schema.organizations.clerkOrgId,
        set: { updatedAt: sql`now()` },
      })
      .returning();

    const [user] = await db
      .insert(schema.users)
      .values({ clerkUserId: userId })
      .onConflictDoUpdate({
        target: schema.users.clerkUserId,
        set: { updatedAt: sql`now()` },
      })
      .returning();

    await db
      .insert(schema.memberships)
      .values({ organizationId: org.id, userId: user.id, role: "owner" })
      .onConflictDoNothing();

    return org;
  } catch {
    return null;
  }
}

/** Mutations must call this — throws if there is no active, resolved org. */
export async function requireOrg(): Promise<Org> {
  const org = await getActiveOrg();
  if (!org) throw new Error("No active organization");
  return org;
}
