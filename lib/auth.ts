import { auth } from "@clerk/nextjs/server";

/**
 * Whether Clerk is configured. When false, the whole app degrades gracefully:
 * proxy.ts skips auth, the dashboard renders without a ClerkProvider, and
 * `getAuthContext()` returns nulls. This lets the scaffold build and run with
 * zero third-party accounts. See IMPLEMENTATION_PLAN.md §3.
 */
export const clerkConfigured = !!(
  process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
);

export type AuthContext = {
  configured: boolean;
  userId: string | null;
  /** Clerk organization id — maps to our `organizations.clerkOrgId`. */
  orgId: string | null;
  orgSlug: string | null;
  /** Clerk org role (e.g. "org:admin", "org:member") — the authority for
   *  role-gated actions. Never derive authorization from a self-provisioned
   *  local membership row alone. */
  orgRole: string | null;
};

/**
 * Current Clerk auth context for use in Server Components / Server Actions /
 * Route Handlers. Returns nulls when Clerk is not configured.
 *
 * IMPORTANT (tenant isolation): every tenant-scoped query must resolve our
 * `organizations.id` from `orgId` and filter on it — never trust a
 * client-supplied org id. The `withOrg()` data helper (Phase 1) will wrap this.
 */
export async function getAuthContext(): Promise<AuthContext> {
  if (!clerkConfigured) {
    return {
      configured: false,
      userId: null,
      orgId: null,
      orgSlug: null,
      orgRole: null,
    };
  }
  const { userId, orgId, orgSlug, orgRole } = await auth();
  return {
    configured: true,
    userId: userId ?? null,
    orgId: orgId ?? null,
    orgSlug: orgSlug ?? null,
    orgRole: orgRole ?? null,
  };
}

/**
 * Foundation for tenant isolation. Returns the active Clerk org id, throwing if
 * there is no authenticated user / active organization. Phase 1's `withOrg()`
 * builds on this: resolve `organizations.id` via `clerkOrgId = orgId`, then
 * filter EVERY tenant query on it. A null org must hard-fail, never fall through
 * to an unscoped query.
 */
export async function requireOrgId(): Promise<string> {
  const { configured, userId, orgId } = await getAuthContext();
  if (!configured) throw new Error("Auth is not configured");
  if (!userId) throw new Error("Not authenticated");
  if (!orgId) throw new Error("No active organization");
  return orgId;
}
