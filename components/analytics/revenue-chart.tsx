"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatINR, formatINRShort } from "@/lib/format";

const chartConfig = {
  value: {
    label: "Booked revenue",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type RevenueDatum = { month: string; value: number };

export function RevenueChart({ data }: { data: RevenueDatum[] }) {
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[280px] w-full"
    >
      <BarChart accessibilityLayer data={data} margin={{ left: 4, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={52}
          tickFormatter={(v) => formatINRShort(Number(v))}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">Booked revenue</span>
                  <span className="font-mono font-medium tabular-nums">
                    {formatINR(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar
          dataKey="value"
          fill="var(--color-value)"
          radius={[6, 6, 0, 0]}
          maxBarSize={56}
        />
      </BarChart>
    </ChartContainer>
  );
}
