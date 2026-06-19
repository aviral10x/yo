"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Brain,
  Building2,
  CalendarDays,
  Clapperboard,
  FileText,
  Globe,
  ImageIcon,
  Import,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  PartyPopper,
  Settings,
  Star,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portfolio", icon: Building2 },
  { href: "/leads", label: "Leads", icon: Inbox },
  { href: "/imports", label: "Imports", icon: Import },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/events", label: "Events", icon: PartyPopper },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/media", label: "Media", icon: ImageIcon },
  { href: "/studio", label: "Studio", icon: Clapperboard },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/intelligence", label: "Intelligence", icon: Brain },
  { href: "/website", label: "Website", icon: Globe },
  { href: "/team", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

// The proxy serves the dashboard under /dashboard internally but the browser URL
// is the public path (/leads). Normalizing makes active-state hydration-safe.
function normalize(p: string): string {
  const s = p.replace(/^\/dashboard/, "");
  return s === "" ? "/" : s;
}

export function DashboardNav() {
  const path = normalize(usePathname() || "/");
  return (
    <nav className="space-y-1">
      {NAV.map((i) => {
        const active = i.href === "/" ? path === "/" : path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <i.icon className="size-4" />
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
