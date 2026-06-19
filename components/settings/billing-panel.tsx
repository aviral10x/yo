"use client";

import { Check, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  FEATURES,
  PLAN_META,
  hasFeature,
  type Feature,
  type Plan,
} from "@/lib/plans";

const PLAN_ORDER: Plan[] = ["starter", "growth", "portfolio"];

/** Human labels for entitlement flags, shown as the per-plan feature list. */
const FEATURE_LABELS: Record<Feature, string> = {
  website: "Venue website builder",
  crm: "Lead CRM & pipeline",
  calendar: "Availability calendar",
  proposals: "Quotes & proposals",
  deposits: "Online deposits (Razorpay)",
  gbp_pack: "Google Business Profile pack",
  reviews: "Reviews & responses",
  wa_templates: "WhatsApp templates",
  room_inventory: "Room inventory",
  package_builder: "Package builder",
  event_sheets: "Event day sheets",
  vendors: "Vendor directory",
  content_studio: "AI content studio",
  analytics: "Conversion analytics",
  multi_property: "Multi-property dashboard",
  team_inbox: "Shared team inbox",
  roles: "Roles & permissions",
  central_reporting: "Central reporting",
  bulk_ops: "Bulk operations",
};

export function BillingPanel({ currentPlan }: { currentPlan: Plan }) {
  const currentIndex = PLAN_ORDER.indexOf(currentPlan);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {PLAN_ORDER.map((plan, index) => {
        const meta = PLAN_META[plan];
        const isCurrent = plan === currentPlan;
        const isDowngrade = index < currentIndex;

        return (
          <Card
            key={plan}
            className={cn(
              "relative flex flex-col border-border/70",
              isCurrent && "border-primary/60 shadow-md ring-1 ring-primary/20",
            )}
          >
            {isCurrent && (
              <span className="absolute -top-2.5 left-6 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                <Sparkles className="size-3" /> Current plan
              </span>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{meta.label}</CardTitle>
                {plan === "growth" && !isCurrent && (
                  <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-primary"
                  >
                    Popular
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{meta.tagline}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-semibold tabular-nums">
                  {formatINR(meta.monthlyInr)}
                </span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </div>
            </CardHeader>

            <CardContent className="flex-1">
              <ul className="space-y-2 text-sm">
                {FEATURES.map((feature) => {
                  const included = hasFeature(plan, feature);
                  return (
                    <li
                      key={feature}
                      className={cn(
                        "flex items-center gap-2",
                        !included && "text-muted-foreground/60",
                      )}
                    >
                      {included ? (
                        <Check className="size-4 shrink-0 text-primary" />
                      ) : (
                        <Lock className="size-3.5 shrink-0 text-muted-foreground/50" />
                      )}
                      <span>{FEATURE_LABELS[feature]}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={isCurrent ? "outline" : isDowngrade ? "ghost" : "default"}
                disabled={isCurrent}
                onClick={() =>
                  toast.success(
                    isDowngrade
                      ? `Switching to ${meta.label}`
                      : `Upgrade to ${meta.label}`,
                    {
                      description:
                        "Checkout opens once Razorpay billing is connected.",
                    },
                  )
                }
              >
                {isCurrent
                  ? "Current plan"
                  : isDowngrade
                    ? `Switch to ${meta.label}`
                    : `Upgrade to ${meta.label}`}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
