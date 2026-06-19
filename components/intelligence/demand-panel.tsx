"use client";

import { Flame, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DemandTrendChart } from "./demand-trend-chart";
import type { DemandPoint } from "./types";

/** Emerald-scale cell style by intensity 0–100. */
function cellStyle(demand: number): { className: string; text: string } {
  if (demand >= 85) {
    return {
      className: "bg-emerald-600 border-emerald-700",
      text: "text-white",
    };
  }
  if (demand >= 60) {
    return {
      className: "bg-emerald-400 border-emerald-500",
      text: "text-emerald-950",
    };
  }
  if (demand >= 40) {
    return {
      className:
        "bg-emerald-200 border-emerald-300 dark:bg-emerald-500/40 dark:border-emerald-500/50",
      text: "text-emerald-950 dark:text-emerald-50",
    };
  }
  return {
    className:
      "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/15 dark:border-emerald-500/25",
    text: "text-emerald-800 dark:text-emerald-200",
  };
}

function intensityLabel(demand: number): string {
  if (demand >= 85) return "Peak";
  if (demand >= 60) return "High";
  if (demand >= 40) return "Steady";
  return "Quiet";
}

export function DemandPanel({ data }: { data: DemandPoint[] }) {
  const peaks = [...data]
    .sort((a, b) => b.demand - a.demand)
    .slice(0, 3)
    .filter((d) => d.demand >= 60);
  const avg =
    data.length > 0
      ? Math.round(data.reduce((sum, d) => sum + d.demand, 0) / data.length)
      : 0;

  return (
    <div className="space-y-6">
      {peaks.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-50/60 p-4 dark:bg-emerald-500/10">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
            <Flame className="size-[18px]" />
          </span>
          <div>
            <p className="text-sm font-semibold">
              Peak season:{" "}
              {peaks.map((p) => p.month.split(" ")[0]).join(", ")}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Demand tops out at {peaks[0].demand}/100 in {peaks[0].month}. Hold
              your premium pricing and prioritise enquiries for these dates.
            </p>
          </div>
        </div>
      )}

      <Card className="border-border/70">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Demand heat-map</CardTitle>
          <span className="text-xs text-muted-foreground tabular-nums">
            avg {avg}/100
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
            {data.map((d) => {
              const s = cellStyle(d.demand);
              const [mon, year] = d.month.split(" ");
              return (
                <div
                  key={d.month}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-3 text-center transition-colors",
                    s.className,
                  )}
                  title={`${d.month}: ${intensityLabel(d.demand)} (${d.demand}/100)`}
                >
                  <span className={cn("text-xs font-medium", s.text)}>
                    {mon}
                  </span>
                  <span className={cn("text-lg font-semibold tabular-nums", s.text)}>
                    {d.demand}
                  </span>
                  <span className={cn("text-[10px] opacity-80", s.text)}>
                    {year}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm border border-emerald-100 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/15" />
              Quiet
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm border border-emerald-300 bg-emerald-200 dark:border-emerald-500/50 dark:bg-emerald-500/40" />
              Steady
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm border border-emerald-500 bg-emerald-400" />
              High
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm border border-emerald-700 bg-emerald-600" />
              Peak
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-primary" />
            Demand trend
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Booking-demand intensity over the next nine months.
          </p>
        </CardHeader>
        <CardContent>
          <DemandTrendChart data={data} />
        </CardContent>
      </Card>
    </div>
  );
}
