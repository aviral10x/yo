import { Check, ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ROLES, ROLE_ICON, ROLE_PERMISSIONS, ROLE_TONE } from "./team-types";

export function RolesExplainer() {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4 text-primary" />
          Roles & permissions
        </CardTitle>
        <CardDescription>
          What each role can do across leads, bookings, and settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {ROLES.map((r) => {
          const perms = ROLE_PERMISSIONS[r.value];
          const tone = ROLE_TONE[r.value];
          const Icon = ROLE_ICON[r.value];
          return (
            <div
              key={r.value}
              className="flex flex-col gap-3 rounded-lg border border-border/70 p-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    tone.badge,
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{r.label}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{perms.summary}</p>
              <ul className="space-y-1.5">
                {perms.can.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
