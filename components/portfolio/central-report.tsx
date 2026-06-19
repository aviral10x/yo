import { ArrowDownRight, ArrowUpRight, Layers, Trophy } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatINRShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PropertyRow } from "./property-types";

function Row({
  icon: Icon,
  tone,
  label,
  name,
  detail,
}: {
  icon: typeof Trophy;
  tone: string;
  label: string;
  name: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
          tone,
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground tabular-nums">{detail}</p>
      </div>
    </div>
  );
}

export function CentralReport({
  properties,
  totalEnquiries,
  totalRevenue,
}: {
  properties: PropertyRow[];
  totalEnquiries: number;
  totalRevenue: number;
}) {
  const byRevenue = [...properties].sort((a, b) => b.revenue - a.revenue);
  const best = byRevenue[0];
  const worst = byRevenue[byRevenue.length - 1];
  const single = properties.length < 2;

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="size-4 text-primary" />
          Central report
        </CardTitle>
        <CardDescription>
          Rolled up across {properties.length}{" "}
          {properties.length === 1 ? "property" : "properties"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {best && (
          <Row
            icon={Trophy}
            tone="bg-emerald-500/10 text-emerald-600"
            label="Top performer"
            name={best.name}
            detail={`${formatINRShort(best.revenue)} · ${best.occupancy}% occupancy`}
          />
        )}
        {!single && worst && (
          <Row
            icon={ArrowDownRight}
            tone="bg-amber-500/10 text-amber-600"
            label="Needs attention"
            name={worst.name}
            detail={`${formatINRShort(worst.revenue)} · ${worst.occupancy}% occupancy`}
          />
        )}

        <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowUpRight className="size-3.5" />
            Total pipeline
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatINRShort(totalRevenue)}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {totalEnquiries.toLocaleString("en-IN")} enquiries across the group
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
