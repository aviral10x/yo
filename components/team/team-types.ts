import { Crown, Shield, User, type LucideIcon } from "lucide-react";

export type Role = "owner" | "manager" | "staff";

export type MemberRow = {
  /** Membership id — the record we mutate when changing a role. */
  id: string;
  name: string;
  email: string;
  role: Role;
  lastActive: string;
};

/** Ordered roles for selects and stat tiles (most → least access). */
export const ROLES: { value: Role; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Staff" },
];

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  manager: "Manager",
  staff: "Staff",
};

export const ROLE_ICON: Record<Role, LucideIcon> = {
  owner: Crown,
  manager: Shield,
  staff: User,
};

/** Light-first badge tones, emerald-led to match the design language. */
export const ROLE_TONE: Record<Role, { badge: string; dot: string }> = {
  owner: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  manager: {
    badge: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20",
    dot: "bg-sky-500",
  },
  staff: {
    badge: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
    dot: "bg-muted-foreground/50",
  },
};

/** What each role can do — drives the permissions explainer card. */
export const ROLE_PERMISSIONS: Record<
  Role,
  { summary: string; can: string[] }
> = {
  owner: {
    summary: "Full control of the venue, billing, and team.",
    can: [
      "Manage billing & subscription",
      "Invite members and change roles",
      "Edit every venue, package & website",
      "Delete leads, bookings & data",
    ],
  },
  manager: {
    summary: "Runs day-to-day sales and operations.",
    can: [
      "Work leads, quotes & bookings",
      "Manage calendar & site visits",
      "Edit packages, media & reviews",
      "View analytics",
    ],
  },
  staff: {
    summary: "Handles enquiries and front-desk tasks.",
    can: [
      "Capture & reply to enquiries",
      "Schedule site visits",
      "View calendar & bookings",
      "Cannot change pricing or team",
    ],
  },
};

/** Initials for the avatar fallback, e.g. "Sunita Rao" → "SR". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
