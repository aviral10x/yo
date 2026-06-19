"use client";

import { Crown, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type TeamMember = {
  name: string;
  email: string;
  role: "owner" | "manager" | "staff";
  you?: boolean;
};

const ROLE_META: Record<
  TeamMember["role"],
  { label: string; className: string }
> = {
  owner: {
    label: "Owner",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  manager: {
    label: "Manager",
    className: "border-primary/30 bg-primary/10 text-primary",
  },
  staff: {
    label: "Staff",
    className: "border-border bg-muted text-muted-foreground",
  },
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TeamPanel({ members }: { members: TeamMember[] }) {
  return (
    <Card className="border-border/70">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-base">Team members</CardTitle>
          <CardDescription>
            Owners and managers can edit leads, bookings, and venue settings.
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() =>
            toast.success("Invite ready", {
              description:
                "We'll email an invite link once seats are enabled on your plan.",
            })
          }
        >
          <UserPlus className="size-4" /> Invite
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y">
          {members.map((m) => {
            const role = ROLE_META[m.role];
            return (
              <div
                key={m.email}
                className="flex items-center justify-between gap-4 py-3.5 first:pt-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{initials(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {m.name}
                      {m.role === "owner" && (
                        <Crown className="size-3.5 text-amber-500" />
                      )}
                      {m.you && (
                        <span className="text-xs font-normal text-muted-foreground">
                          (You)
                        </span>
                      )}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Mail className="size-3" /> {m.email}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={role.className}>
                  {role.label}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
