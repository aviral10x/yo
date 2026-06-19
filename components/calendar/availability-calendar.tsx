"use client";

import * as React from "react";
import { CalendarRange } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type CalendarSpace = { id: string; name: string };
export type CalendarBlock = {
  date: string;
  spaceId: string;
  kind: "hold" | "confirmed" | "blackout";
};

const KIND_META: Record<
  CalendarBlock["kind"],
  { label: string; dot: string; cell: string }
> = {
  hold: {
    label: "Provisional hold",
    dot: "bg-amber-500",
    cell: "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium rounded-md",
  },
  confirmed: {
    label: "Confirmed booking",
    dot: "bg-emerald-500",
    cell: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-medium rounded-md",
  },
  blackout: {
    label: "Blackout / maintenance",
    dot: "bg-muted-foreground/60",
    cell: "bg-muted text-muted-foreground line-through rounded-md",
  },
};

/** Parse "YYYY-MM-DD" as a local date (avoids UTC off-by-one). */
function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function AvailabilityCalendar({
  spaces,
  blocks,
  defaultMonth,
}: {
  spaces: CalendarSpace[];
  blocks: CalendarBlock[];
  /** ISO date used to position the initial visible month. */
  defaultMonth?: string;
}) {
  const [spaceId, setSpaceId] = React.useState<string>(
    spaces[0]?.id ?? "__all",
  );
  const [selected, setSelected] = React.useState<Date | undefined>(undefined);

  // Blocks for the chosen space (or every space when "All spaces").
  const visibleBlocks = React.useMemo(
    () =>
      spaceId === "__all"
        ? blocks
        : blocks.filter((b) => b.spaceId === spaceId),
    [blocks, spaceId],
  );

  // Group dates by kind for react-day-picker modifiers. When viewing all
  // spaces, a confirmed booking wins over a hold which wins over a blackout.
  const modifiers = React.useMemo(() => {
    const priority: Record<CalendarBlock["kind"], number> = {
      confirmed: 3,
      hold: 2,
      blackout: 1,
    };
    const byDate = new Map<string, CalendarBlock["kind"]>();
    for (const b of visibleBlocks) {
      const existing = byDate.get(b.date);
      if (!existing || priority[b.kind] > priority[existing]) {
        byDate.set(b.date, b.kind);
      }
    }
    const hold: Date[] = [];
    const confirmed: Date[] = [];
    const blackout: Date[] = [];
    for (const [date, kind] of byDate) {
      const d = parseDate(date);
      if (kind === "hold") hold.push(d);
      else if (kind === "confirmed") confirmed.push(d);
      else blackout.push(d);
    }
    return { hold, confirmed, blackout };
  }, [visibleBlocks]);

  const initialMonth = React.useMemo(
    () => (defaultMonth ? parseDate(defaultMonth) : new Date()),
    [defaultMonth],
  );

  // Details for the day the owner clicks.
  const selectedISO = selected ? toISO(selected) : null;
  const selectedBlocks = selectedISO
    ? visibleBlocks.filter((b) => b.date === selectedISO)
    : [];

  const spaceName = (id: string) =>
    spaces.find((s) => s.id === id)?.name ?? "Space";

  return (
    <Card className="border-border/70">
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarRange className="size-4 text-primary" />
          Availability calendar
        </CardTitle>
        <Select value={spaceId} onValueChange={setSpaceId}>
          <SelectTrigger size="sm" className="w-[180px]">
            <SelectValue placeholder="Select a space" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All spaces</SelectItem>
            {spaces.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          defaultMonth={initialMonth}
          showOutsideDays
          className="w-full p-0"
          classNames={{
            months: "w-full",
            month: "w-full space-y-3",
            table: "w-full border-collapse",
            week: "mt-1.5 flex w-full",
          }}
          modifiers={{
            hold: modifiers.hold,
            confirmed: modifiers.confirmed,
            blackout: modifiers.blackout,
          }}
          modifiersClassNames={{
            hold: KIND_META.hold.cell,
            confirmed: KIND_META.confirmed.cell,
            blackout: KIND_META.blackout.cell,
          }}
        />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-xs text-muted-foreground">
          {(
            Object.keys(KIND_META) as CalendarBlock["kind"][]
          ).map((kind) => (
            <span key={kind} className="flex items-center gap-1.5">
              <span
                className={cn("size-2.5 rounded-full", KIND_META[kind].dot)}
              />
              {KIND_META[kind].label}
            </span>
          ))}
        </div>

        {selectedISO && (
          <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
            <p className="text-sm font-medium">{formatDate(selectedISO)}</p>
            {selectedBlocks.length === 0 ? (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-500" />
                {spaceId === "__all"
                  ? "All spaces free"
                  : `${spaceName(spaceId)} is free`}{" "}
                on this date.
              </p>
            ) : (
              <ul className="mt-1.5 space-y-1.5">
                {selectedBlocks.map((b, i) => (
                  <li
                    key={`${b.spaceId}-${i}`}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          KIND_META[b.kind].dot,
                        )}
                      />
                      {spaceName(b.spaceId)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {KIND_META[b.kind].label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
