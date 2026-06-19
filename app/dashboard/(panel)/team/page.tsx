import { Crown, Shield, User, Users } from "lucide-react";
import { asc, eq } from "drizzle-orm";

import { PageHeader } from "@/components/dashboard/page-header";
import { Stat } from "@/components/dashboard/stat";
import { MembersTable } from "@/components/team/members-table";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import { RolesExplainer } from "@/components/team/roles-explainer";
import { type MemberRow, type Role } from "@/components/team/team-types";
import { DEMO_TEAM } from "@/lib/demo-data";
import { getDb, schema } from "@/lib/db";
import { getActiveOrg } from "@/lib/org";
import { getAuthContext } from "@/lib/auth";
import { formatDate } from "@/lib/format";

/** Order members owner → manager → staff for a stable, scannable table. */
const ROLE_RANK: Record<Role, number> = { owner: 0, manager: 1, staff: 2 };

type LoadResult = {
  members: MemberRow[];
  liveDb: boolean;
  /** Whether the current viewer is an owner (can change roles / invite). */
  canManage: boolean;
};

async function loadTeam(): Promise<LoadResult> {
  const org = await getActiveOrg();
  if (!org) {
    // Demo: render fully; the viewer is treated as the owner so the role
    // controls are visible, but edits show a "connect a database" toast.
    return {
      liveDb: false,
      canManage: true,
      members: DEMO_TEAM.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        lastActive: m.lastActive,
      })),
    };
  }

  const rows = await getDb()
    .select({
      id: schema.memberships.id,
      role: schema.memberships.role,
      createdAt: schema.memberships.createdAt,
      name: schema.users.name,
      email: schema.users.email,
      clerkUserId: schema.users.clerkUserId,
    })
    .from(schema.memberships)
    .innerJoin(schema.users, eq(schema.memberships.userId, schema.users.id))
    .where(eq(schema.memberships.organizationId, org.id))
    .orderBy(asc(schema.memberships.createdAt));

  const { userId } = await getAuthContext();
  const canManage = rows.some(
    (r) => r.clerkUserId === userId && r.role === "owner",
  );

  const members: MemberRow[] = rows
    .map((r) => ({
      id: r.id,
      name: r.name ?? r.email ?? "Teammate",
      email: r.email ?? "—",
      role: r.role as Role,
      lastActive: formatDate(r.createdAt),
    }))
    .sort((a, b) => ROLE_RANK[a.role] - ROLE_RANK[b.role]);

  return { members, liveDb: true, canManage };
}

export default async function TeamPage() {
  const { members, liveDb, canManage } = await loadTeam();

  const total = members.length;
  const owners = members.filter((m) => m.role === "owner").length;
  const managers = members.filter((m) => m.role === "manager").length;
  const staff = members.filter((m) => m.role === "staff").length;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Team"
        description={
          liveDb
            ? "Members, roles, and access across your venue."
            : "Showing a demo team. Connect a database to manage live members."
        }
        action={<InviteMemberDialog liveDb={liveDb} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Total members" value={total} hint="all roles" />
        <Stat icon={Crown} label="Owners" value={owners} hint="full access" />
        <Stat icon={Shield} label="Managers" value={managers} hint="sales & ops" />
        <Stat icon={User} label="Staff" value={staff} hint="front desk" />
      </div>

      <MembersTable members={members} canManage={canManage} liveDb={liveDb} />

      <RolesExplainer />

      {!liveDb && (
        <p className="text-center text-xs text-muted-foreground">
          This is a demo team. Connect Clerk + a database to invite real
          members and manage their roles.
        </p>
      )}
    </div>
  );
}
