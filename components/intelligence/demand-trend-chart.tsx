"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DemandPoint } from "./types";

const chartConfig = {
  demand: {
    label: "Demand",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

/** Color a bar along the emerald scale by intensity. */
function barColor(demand: number): string {
  if (demand >= 85) return "var(--chart-1)";
  if (demand >= 60) return "color-mix(in oklab, var(--chart-1) 72%, white)";
  if (demand >= 40) return "color-mix(in oklab, var(--chart-1) 48%, white)";
  return "color-mix(in oklab, var(--chart-1) 26%, white)";
}

/** Short month label ("Nov 2026" -> "Nov"). */
function shortMonth(month: string): string {
  return month.split(" ")[0] ?? month;
}

export function DemandTrendChart({ data }: { data: DemandPoint[] }) {
  const rows = data.map((d) => ({ ...d, short: shortMonth(d.month) }));

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
      <BarChart accessibilityLayer data={rows} margin={{ left: -18, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="short" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={36}
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideIndicator
              labelKey="month"
              formatter={(value) => (
                <span className="font-mono font-medium tabular-nums">
                  {value as number}
                  <span className="ml-1 font-sans text-muted-foreground">
                    / 100
                  </span>
                </span>
              )}
            />
          }
        />
        <Bar dataKey="demand" radius={[5, 5, 0, 0]} maxBarSize={44}>
          {rows.map((r) => (
            <Cell key={r.month} fill={barColor(r.demand)} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
