"use client";

import { useMemo } from "react";
import { Cell, Label, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type SourceDatum = { source: string; value: number };

// Stable slot key per slice so the donut + legend share the same colors.
const SLICE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-5)",
  "var(--chart-4)",
];

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function SourcesChart({ data }: { data: SourceDatum[] }) {
  const { rows, config, total } = useMemo(() => {
    const rows = data.map((d, i) => ({
      key: slug(d.source),
      source: d.source,
      value: d.value,
      fill: SLICE_COLORS[i % SLICE_COLORS.length],
    }));
    const config: ChartConfig = { value: { label: "Enquiries" } };
    for (const r of rows) config[r.key] = { label: r.source, color: r.fill };
    const total = rows.reduce((sum, r) => sum + r.value, 0);
    return { rows, config, total };
  }, [data]);

  return (
    <ChartContainer
      config={config}
      className="mx-auto aspect-square h-[280px] w-full"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent nameKey="key" hideLabel />}
        />
        <Pie
          data={rows}
          dataKey="value"
          nameKey="key"
          innerRadius={62}
          outerRadius={96}
          paddingAngle={2}
          strokeWidth={2}
        >
          {rows.map((r) => (
            <Cell key={r.key} fill={r.fill} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox)) return null;
              return (
                <text
                  x={viewBox.cx}
                  y={viewBox.cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  <tspan
                    x={viewBox.cx}
                    y={viewBox.cy}
                    className="fill-foreground text-2xl font-semibold tabular-nums"
                  >
                    {total.toLocaleString("en-IN")}
                  </tspan>
                  <tspan
                    x={viewBox.cx}
                    y={(viewBox.cy ?? 0) + 20}
                    className="fill-muted-foreground text-xs"
                  >
                    enquiries
                  </tspan>
                </text>
              );
            }}
          />
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="key" />}
          className="flex-wrap gap-x-4 gap-y-1.5"
        />
      </PieChart>
    </ChartContainer>
  );
}
