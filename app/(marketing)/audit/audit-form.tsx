"use client";

import { useActionState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AuditDimension, AuditResult } from "@/lib/audit";
import { appUrl } from "@/lib/urls";
import { runAuditAction, type AuditState } from "./actions";

const STATUS_META = {
  strong: { color: "text-emerald-600", ring: "stroke-emerald-500", Icon: CheckCircle2, label: "Strong" },
  needs_work: { color: "text-amber-600", ring: "stroke-amber-500", Icon: AlertTriangle, label: "Needs work" },
  critical: { color: "text-red-600", ring: "stroke-red-500", Icon: XCircle, label: "Critical" },
} as const;

const GRADE_COLOR: Record<AuditResult["grade"], string> = {
  A: "text-emerald-600",
  B: "text-emerald-600",
  C: "text-amber-600",
  D: "text-red-600",
};

export function AuditForm() {
  const [state, action, pending] = useActionState<AuditState, FormData>(
    runAuditAction,
    { status: "idle" },
  );

  if (state.status === "success") {
    return <AuditReport result={state.result} />;
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="size-4 text-primary" />
          Run your AI growth audit
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="venue">Venue name *</Label>
            <Input id="venue" name="venue" required placeholder="Rose Garden Lawns" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" placeholder="Jaipur" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">WhatsApp</Label>
              <Input id="phone" name="phone" placeholder="+91…" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="url">Website or Google Maps link</Label>
            <Input id="url" name="url" placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" name="instagram" placeholder="@yourvenue" />
          </div>

          {state.status === "error" && (
            <p className="text-sm text-red-600">{state.message}</p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Analyzing your venue…
              </>
            ) : (
              <>
                Generate my free audit <ArrowRight className="size-4" />
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Takes ~15 seconds. No signup required.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

function ScoreRing({ score, grade }: { score: number; grade: AuditResult["grade"] }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const stroke =
    grade === "C" ? "stroke-amber-500" : grade === "D" ? "stroke-red-500" : "stroke-emerald-500";
  return (
    <div className="relative size-32 shrink-0">
      <svg viewBox="0 0 120 120" className="size-32 -rotate-90">
        <circle cx="60" cy="60" r={r} className="fill-none stroke-muted" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          className={cn("fill-none transition-all", stroke)}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold", GRADE_COLOR[grade])}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function DimensionRow({ d }: { d: AuditDimension }) {
  const meta = STATUS_META[d.status];
  return (
    <div className="flex gap-3 border-t py-4 first:border-t-0">
      <meta.Icon className={cn("mt-0.5 size-5 shrink-0", meta.color)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium">{d.label}</p>
          <span className={cn("text-sm font-semibold tabular-nums", meta.color)}>
            {d.score}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{d.finding}</p>
        <p className="mt-1 text-sm">
          <span className="font-medium text-primary">Fix: </span>
          {d.recommendation}
        </p>
      </div>
    </div>
  );
}

function AuditReport({ result }: { result: AuditResult }) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <div className="border-b bg-gradient-to-br from-primary/8 to-amber-500/8 p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <ScoreRing score={result.overallScore} grade={result.grade} />
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  Grade {result.grade}
                </span>
                <span className="text-xs text-muted-foreground">
                  {result.generatedByAI ? "AI-generated" : "Demo estimate"}
                </span>
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                {result.venue}
                {result.city ? `, ${result.city}` : ""}
              </h2>
              <p className="mt-1 text-pretty text-muted-foreground">
                {result.headline}
              </p>
            </div>
          </div>
        </div>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">{result.summary}</p>
          <div className="rounded-lg border border-amber-500/30 bg-amber-50/60 p-3 text-sm dark:bg-amber-500/10">
            <span className="font-medium text-amber-700 dark:text-amber-400">
              Estimated upside:{" "}
            </span>
            {result.estimatedUpside}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Dimension-by-dimension</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {result.dimensions.map((d) => (
              <DimensionRow key={d.key} d={d} />
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Top fixes, prioritized</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {result.topFixes.map((f, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{f.title}</p>
                  <div className="mt-2 flex gap-2 text-xs">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-700 dark:text-emerald-400">
                      {f.impact} impact
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                      {f.effort} effort
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5 shadow-sm">
            <CardContent className="space-y-3 pt-6">
              <p className="font-medium">Want this fixed for you?</p>
              <p className="text-sm text-muted-foreground">
                VenuePilot ships every fix above as one product — website,
                availability, deposits, and AI replies.
              </p>
              <Button asChild className="w-full">
                <a href={`${appUrl}/sign-up`}>
                  Get started <ArrowRight className="size-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
