"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Filter, Inbox, Search } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EVENT_TYPE_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STAGES,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LeadDetailSheet } from "./lead-detail-sheet";
import { STAGE_LABEL, STAGE_TONE, type LeadRow } from "./lead-types";

export function LeadsBoard({
  leads,
  liveDb,
}: {
  leads: LeadRow[];
  liveDb: boolean;
}) {
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selected, setSelected] = useState<LeadRow | null>(null);
  const [open, setOpen] = useState(false);

  const sources = useMemo(() => {
    const present = new Set(leads.map((l) => l.source));
    return Object.entries(LEAD_SOURCE_LABELS).filter(([v]) => present.has(v));
  }, [leads]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (stageFilter !== "all" && l.stage !== stageFilter) return false;
      if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
      if (q) {
        const hay = `${l.coupleName} ${l.phone} ${l.email ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, query, stageFilter, sourceFilter]);

  function openLead(lead: LeadRow) {
    setSelected(lead);
    setOpen(true);
  }

  const filtersActive =
    stageFilter !== "all" || sourceFilter !== "all" || query.trim() !== "";

  return (
    <Card className="border-border/70 gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">
          All enquiries
          <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
            {filtered.length}
            {filtered.length !== leads.length && ` of ${leads.length}`}
          </span>
        </CardTitle>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or phone…"
              className="h-9 w-full pl-8 sm:w-56"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger size="sm" className="w-full sm:w-[150px]">
              <Filter className="size-3.5" />
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {LEAD_STAGES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger size="sm" className="w-full sm:w-[140px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {sources.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Inbox className="size-6" />
            </span>
            <div>
              <p className="font-medium">
                {filtersActive ? "No enquiries match" : "No enquiries yet"}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {filtersActive
                  ? "Try clearing a filter or search term."
                  : "Capture your first enquiry to start the pipeline."}
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Couple</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Guests</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="w-8 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => {
                const tone = STAGE_TONE[lead.stage] ?? STAGE_TONE.new;
                return (
                  <TableRow
                    key={lead.id}
                    onClick={() => openLead(lead)}
                    className="cursor-pointer"
                  >
                    <TableCell className="pl-4">
                      <div className="font-medium">{lead.coupleName}</div>
                      <div className="text-xs text-muted-foreground">
                        {lead.phone}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {EVENT_TYPE_LABELS[lead.eventType] ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {formatDate(lead.dateRequested)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {lead.guestCount
                        ? lead.guestCount.toLocaleString("en-IN")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {LEAD_SOURCE_LABELS[lead.source] ?? "Direct"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                          tone.badge,
                        )}
                      >
                        <span className={cn("size-1.5 rounded-full", tone.dot)} />
                        {STAGE_LABEL[lead.stage]}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Remount per selected lead so the stage Select resets cleanly. */}
      <LeadDetailSheet
        key={selected?.id ?? "none"}
        lead={selected}
        open={open}
        onOpenChange={setOpen}
        liveDb={liveDb}
      />
    </Card>
  );
}
