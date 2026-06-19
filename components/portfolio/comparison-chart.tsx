"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR, formatINRShort } from "@/lib/format";
import type { PropertyRow } from "./property-types";

type Metric = "revenue" | "occupancy";

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  occupancy: { label: "Occupancy", color: "var(--chart-2)" },
} satisfies ChartConfig;

/** Keep axis labels short — first word of the venue name plus city initials. */
function shortName(name: string): string {
  const first = name.split(" ")[0];
  return first.length > 12 ? `${first.slice(0, 11)}…` : first;
}

export function ComparisonChart({ properties }: { properties: PropertyRow[] }) {
  const [metric, setMetric] = useState<Metric>("revenue");

  const data = useMemo(() => {
    const rows = properties.map((p) => ({
      name: shortName(p.name),
      fullName: p.name,
      city: p.city,
      revenue: p.revenue,
      occupancy: p.occupancy,
    }));
    return [...rows].sort((a, b) => b[metric] - a[metric]);
  }, [properties, metric]);

  const isRevenue = metric === "revenue";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Ranked across all properties
        </p>
        <Select value={metric} onValueChange={(v) => setMetric(v as Metric)}>
          <SelectTrigger size="sm" className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="occupancy">Occupancy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
        <BarChart accessibilityLayer data={data} margin={{ left: 4, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={isRevenue ? 52 : 40}
            tickFormatter={(v) =>
              isRevenue ? formatINRShort(Number(v)) : `${v}%`
            }
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, _name, item) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {item.payload.fullName}
                    </span>
                    <span className="font-mono font-medium tabular-nums">
                      {isRevenue
                        ? formatINR(Number(value))
                        : `${Number(value)}%`}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar
            dataKey={metric}
            fill={`var(--color-${metric})`}
            radius={[6, 6, 0, 0]}
            maxBarSize={64}
          >
            <LabelList
              dataKey={metric}
              position="top"
              offset={8}
              className="fill-muted-foreground"
              fontSize={11}
              formatter={(v: string | number | boolean | null | undefined) =>
                isRevenue ? formatINRShort(Number(v)) : `${v}%`
              }
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
