"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Building2, Search } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VENUE_TYPE_LABELS } from "@/lib/constants";
import { formatINRShort } from "@/lib/format";
import { venueUrl } from "@/lib/urls";
import { cn } from "@/lib/utils";
import type { PropertyRow } from "./property-types";

/** Tint the occupancy bar by how full each property runs. */
function occupancyTone(pct: number): string {
  if (pct >= 70) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

export function PropertiesTable({
  properties,
}: {
  properties: PropertyRow[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? properties.filter((p) =>
          `${p.name} ${p.city} ${VENUE_TYPE_LABELS[p.type] ?? ""}`
            .toLowerCase()
            .includes(q),
        )
      : properties;
    return [...rows].sort((a, b) => b.revenue - a.revenue);
  }, [properties, query]);

  return (
    <Card className="border-border/70 gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">
          Properties
          <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
            {filtered.length}
            {filtered.length !== properties.length &&
              ` of ${properties.length}`}
          </span>
        </CardTitle>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search venue or city…"
            className="h-9 w-full pl-8 sm:w-60"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Building2 className="size-6" />
            </span>
            <div>
              <p className="font-medium">No properties match</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Try a different venue or city.
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Enquiries</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
                <TableHead className="w-[180px]">Occupancy</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="w-8 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-4">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.city}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {VENUE_TYPE_LABELS[p.type] ?? p.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.enquiries.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.bookings.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-full max-w-[110px] overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full", occupancyTone(p.occupancy))}
                          style={{ width: `${Math.min(p.occupancy, 100)}%` }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        {p.occupancy}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatINRShort(p.revenue)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <a
                      href={venueUrl(p.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${p.name} site`}
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <ArrowUpRight className="size-4" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
