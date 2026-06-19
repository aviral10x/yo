"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  enquiries: {
    label: "Enquiries",
    color: "var(--chart-3)",
  },
  bookings: {
    label: "Bookings",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type TrendDatum = { month: string; enquiries: number; bookings: number };

export function TrendChart({ data }: { data: TrendDatum[] }) {
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[280px] w-full"
    >
      <AreaChart accessibilityLayer data={data} margin={{ left: -16, right: 8 }}>
        <defs>
          <linearGradient id="fillEnquiries" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-enquiries)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--color-enquiries)" stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id="fillBookings" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-bookings)" stopOpacity={0.45} />
            <stop offset="95%" stopColor="var(--color-bookings)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
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
          width={40}
          allowDecimals={false}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Area
          dataKey="enquiries"
          type="monotone"
          stroke="var(--color-enquiries)"
          fill="url(#fillEnquiries)"
          strokeWidth={2}
          stackId="a"
        />
        <Area
          dataKey="bookings"
          type="monotone"
          stroke="var(--color-bookings)"
          fill="url(#fillBookings)"
          strokeWidth={2}
          stackId="b"
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}
