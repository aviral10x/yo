"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  count: {
    label: "Enquiries",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type FunnelDatum = { stage: string; count: number };

export function FunnelChart({ data }: { data: FunnelDatum[] }) {
  // Largest -> smallest so the funnel reads top-down.
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const top = sorted[0]?.count ?? 0;

  const rows = sorted.map((d) => ({
    ...d,
    // Conversion of each stage relative to the top of the funnel.
    rate: top > 0 ? Math.round((d.count / top) * 100) : 0,
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[280px] w-full"
    >
      <BarChart
        accessibilityLayer
        data={rows}
        layout="vertical"
        margin={{ left: 8, right: 48 }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="stage"
          type="category"
          tickLine={false}
          axisLine={false}
          width={84}
          tickMargin={8}
        />
        <XAxis type="number" dataKey="count" hide />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel={false}
              formatter={(value, _name, item) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {item.payload.stage}
                  </span>
                  <span className="font-mono font-medium tabular-nums">
                    {Number(value).toLocaleString("en-IN")}
                    <span className="ml-1 text-muted-foreground">
                      ({item.payload.rate}%)
                    </span>
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar
          dataKey="count"
          fill="var(--color-count)"
          radius={[0, 6, 6, 0]}
          barSize={28}
        >
          <LabelList
            dataKey="count"
            position="right"
            offset={10}
            className="fill-foreground"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
