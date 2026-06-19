"use client";

import { useTransition } from "react";
import { Flame, Loader2, Snowflake, Sparkles, Sun } from "lucide-react";
import { toast } from "sonner";

import { rescoreLeads } from "@/app/dashboard/(panel)/intelligence/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LeadScore, LeadTier } from "./types";

const TIER_META: Record<
  LeadTier,
  { label: string; icon: typeof Flame; badge: string; bar: string }
> = {
  hot: {
    label: "Hot",
    icon: Flame,
    badge:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  warm: {
    label: "Warm",
    icon: Sun,
    badge:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    bar: "bg-amber-500",
  },
  cold: {
    label: "Cold",
    icon: Snowflake,
    badge: "bg-muted text-muted-foreground",
    bar: "bg-muted-foreground/40",
  },
};

export function LeadScoringPanel({ scores }: { scores: LeadScore[] }) {
  const [pending, start] = useTransition();

  const hot = scores.filter((s) => s.tier === "hot").length;
  const warm = scores.filter((s) => s.tier === "warm").length;
  const cold = scores.filter((s) => s.tier === "cold").length;
  const avg =
    scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
      : 0;

  function handleRescore() {
    start(async () => {
      const result = await rescoreLeads({ hot, warm, cold, avg });
      if (result.ok) {
        toast.success(result.message, {
          description:
            result.source === "ai" ? "Scored with Claude" : "Heuristic scoring",
        });
      } else {
        toast.error(result.message);
      }
    });
  }

  const sorted = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TierStat tier="hot" value={hot} />
        <TierStat tier="warm" value={warm} />
        <TierStat tier="cold" value={cold} />
        <Card className="border-border/70">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-[18px]" />
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums">{avg}</p>
            <p className="text-sm text-muted-foreground">Average score</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 gap-0 overflow-hidden py-0">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b py-4">
          <CardTitle className="text-base">
            Scored enquiries
            <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
              {scores.length}
            </span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRescore}
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Re-scoring…
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Re-score with AI
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {sorted.map((lead) => (
              <ScoreRow key={lead.id} lead={lead} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TierStat({ tier, value }: { tier: LeadTier; value: number }) {
  const meta = TIER_META[tier];
  const Icon = meta.icon;
  return (
    <Card className="border-border/70">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-lg",
              meta.badge,
            )}
          >
            <Icon className="size-[18px]" />
          </span>
        </div>
        <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground">{meta.label} leads</p>
      </CardContent>
    </Card>
  );
}

function ScoreRow({ lead }: { lead: LeadScore }) {
  const meta = TIER_META[lead.tier];
  const Icon = meta.icon;
  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
      {/* Score dial */}
      <div className="flex shrink-0 items-center gap-3 sm:w-44">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-semibold tabular-nums leading-none">
            {lead.score}
          </span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{lead.coupleName}</p>
          <span
            className={cn(
              "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              meta.badge,
            )}
          >
            <Icon className="size-3" />
            {meta.label}
          </span>
        </div>
      </div>

      {/* Score bar + reasons */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", meta.bar)}
            style={{ width: `${lead.score}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {lead.reasons.map((reason) => (
            <span
              key={reason}
              className="inline-flex items-center rounded-full border border-border/70 bg-background px-2 py-0.5 text-xs text-muted-foreground"
            >
              {reason}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
