"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { getActiveOrg } from "@/lib/org";
import { getDb, schema } from "@/lib/db";
import { logActivity } from "@/lib/activity";

const ROUTE = "/dashboard/team";

/** Roles a member can hold. Mirrors `roleEnum` in the schema. */
const VALID_ROLES = new Set<string>(["owner", "manager", "staff"]);

export type ActionState = {
  ok: boolean;
  message: string;
};

function str(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : undefined;
}

/**
 * Resolve the active user's membership in the current org. Used to gate
 * owner-only mutations — we re-check the caller's role server-side rather than
 * trusting any client signal.
 */
async function getCallerRole(orgId: string): Promise<string | null> {
  const { getAuthContext } = await import("@/lib/auth");
  const { userId, orgRole } = await getAuthContext();
  if (!userId) return null;

  // Clerk org admins are always authoritative, independent of the local row.
  if (orgRole === "org:admin") return "owner";

  const [row] = await getDb()
    .select({ role: schema.memberships.role })
    .from(schema.memberships)
    .innerJoin(schema.users, eq(schema.memberships.userId, schema.users.id))
    .where(
      and(
        eq(schema.memberships.organizationId, orgId),
        eq(schema.users.clerkUserId, userId),
      ),
    )
    .limit(1);

  return row?.role ?? null;
}

/**
 * Change a member's role. Owner-only: only an owner may change roles, and we
 * verify the membership belongs to the active org before mutating (never trust
 * a client-supplied membership id). Demo-safe when no DB is connected.
 */
export async function changeRole(
  membershipId: string,
  nextRole: string,
): Promise<ActionState> {
  const org = await getActiveOrg();
  if (!org) {
    return { ok: false, message: "Connect a database to save changes." };
  }
  if (!VALID_ROLES.has(nextRole)) {
    return { ok: false, message: "Unknown role." };
  }

  // Gate: only an owner can change roles.
  const callerRole = await getCallerRole(org.id);
  if (callerRole !== "owner") {
    return { ok: false, message: "Only an owner can change member roles." };
  }

  try {
    // Verify the membership belongs to this org before touching it.
    const [existing] = await getDb()
      .select({ id: schema.memberships.id, role: schema.memberships.role })
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.id, membershipId),
          eq(schema.memberships.organizationId, org.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return { ok: false, message: "That member is no longer in your team." };
    }

    // Guard against removing the last owner — every org needs one.
    if (existing.role === "owner" && nextRole !== "owner") {
      const owners = await getDb()
        .select({ id: schema.memberships.id })
        .from(schema.memberships)
        .where(
          and(
            eq(schema.memberships.organizationId, org.id),
            eq(schema.memberships.role, "owner"),
          ),
        );
      if (owners.length <= 1) {
        return {
          ok: false,
          message: "Add another owner before changing this one.",
        };
      }
    }

    await getDb()
      .update(schema.memberships)
      .set({ role: nextRole as never })
      .where(
        and(
          eq(schema.memberships.id, membershipId),
          eq(schema.memberships.organizationId, org.id),
        ),
      );

    await logActivity({
      organizationId: org.id,
      type: "team.role_changed",
      payload: { membershipId, role: nextRole },
    });

    revalidatePath(ROUTE);
    return { ok: true, message: "Role updated." };
  } catch {
    return { ok: false, message: "Couldn't update the role. Try again." };
  }
}

/**
 * Invite a member by email + role.
 *
 * Owner-only. In a live deployment this should create a Clerk organization
 * invitation (clerkClient.organizations.createOrganizationInvitation) so the
 * invitee receives an email and is provisioned a membership on accept.
 *
 * FOLLOWUP: wire Clerk org invitations. Until then this validates input,
 * logs the intent, and returns a friendly message — no membership row is
 * created locally because the user/membership is owned by Clerk on accept.
 */
export async function inviteMember(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const org = await getActiveOrg();
  if (!org) {
    return {
      ok: false,
      message: "Connect a database to invite teammates.",
    };
  }

  const email = str(formData.get("email"));
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }
  const role = str(formData.get("role")) ?? "staff";
  if (!VALID_ROLES.has(role)) {
    return { ok: false, message: "Pick a valid role." };
  }

  // Gate: only an owner can invite.
  const callerRole = await getCallerRole(org.id);
  if (callerRole !== "owner") {
    return { ok: false, message: "Only an owner can invite teammates." };
  }

  try {
    await logActivity({
      organizationId: org.id,
      type: "team.invite_sent",
      payload: { email, role },
    });

    revalidatePath(ROUTE);
    // FOLLOWUP: replace with a real Clerk org invitation send.
    return {
      ok: true,
      message: `Invitation queued for ${email}. (Connect Clerk invites to email it.)`,
    };
  } catch {
    return { ok: false, message: "Couldn't send that invite. Try again." };
  }
}
