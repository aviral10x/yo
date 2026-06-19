"use client";

import { useState, useTransition } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { changeRole } from "@/app/dashboard/(panel)/team/actions";
import {
  ROLES,
  ROLE_ICON,
  ROLE_LABEL,
  ROLE_TONE,
  initials,
  type MemberRow,
  type Role,
} from "./team-types";

function RoleBadge({ role }: { role: Role }) {
  const tone = ROLE_TONE[role];
  const Icon = ROLE_ICON[role];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        tone.badge,
      )}
    >
      <Icon className="size-3" />
      {ROLE_LABEL[role]}
    </span>
  );
}

function MemberRoleCell({
  member,
  canManage,
  liveDb,
}: {
  member: MemberRow;
  canManage: boolean;
  liveDb: boolean;
}) {
  const [role, setRole] = useState<Role>(member.role);
  const [pending, startTransition] = useTransition();

  // Non-owners (or the read-only demo viewer) just see the badge.
  if (!canManage) return <RoleBadge role={role} />;

  function handleChange(next: string) {
    const previous = role;
    setRole(next as Role);

    if (!liveDb) {
      toast.info("Connect a database to change roles.");
      setRole(previous);
      return;
    }

    startTransition(async () => {
      const res = await changeRole(member.id, next);
      if (res.ok) {
        toast.success(`${member.name} is now ${ROLE_LABEL[next as Role]}.`);
      } else {
        setRole(previous);
        toast.error(res.message);
      }
    });
  }

  return (
    <Select value={role} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger size="sm" className="w-[130px]">
        <span className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", ROLE_TONE[role].dot)} />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r.value} value={r.value}>
            <span className="flex items-center gap-2">
              <span
                className={cn("size-2 rounded-full", ROLE_TONE[r.value].dot)}
              />
              {r.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function MembersTable({
  members,
  canManage,
  liveDb,
}: {
  members: MemberRow[];
  /** Whether the viewer is an owner (can change roles). */
  canManage: boolean;
  liveDb: boolean;
}) {
  return (
    <Card className="border-border/70 gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-row items-center justify-between border-b py-4">
        <CardTitle className="text-base">
          Members
          <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
            {members.length}
          </span>
        </CardTitle>
        {!canManage && (
          <span className="text-xs text-muted-foreground">
            Only owners can change roles
          </span>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Member</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead className="pr-4 text-right">Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id} className="hover:bg-transparent">
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 font-medium text-primary">
                        {initials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{m.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="break-all">{m.email}</span>
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {m.lastActive}
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex justify-end">
                    <MemberRoleCell
                      member={m}
                      canManage={canManage}
                      liveDb={liveDb}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
