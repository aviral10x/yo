"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { toast } from "sonner";

import { placeHoldAction } from "@/app/dashboard/(panel)/proposals/actions";
import {
  AlertTriangle,
  ArrowRight,
  CalendarX2,
  CheckCircle2,
  IndianRupee,
  Loader2,
  Lock,
  PackageOpen,
  Search,
  Users,
} from "lucide-react";

import {
  checkAvailabilityAction,
  type AvailabilityState,
} from "@/app/dashboard/(panel)/calendar/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { formatDate, formatINRShort } from "@/lib/format";
import type {
  AvailabilityResult,
  MatchingPackage,
  NextStep,
  SpaceConflict,
} from "@/lib/availability";
import { cn } from "@/lib/utils";

const EVENT_TYPES = [
  "wedding",
  "reception",
  "sangeet",
  "mehndi",
  "haldi",
  "engagement",
] as const;

const NEXT_STEP_META: Record<
  NextStep["kind"],
  { Icon: typeof CheckCircle2; tone: string; border: string; iconColor: string }
> = {
  place_hold: {
    Icon: Lock,
    tone: "bg-primary/5",
    border: "border-primary/30",
    iconColor: "text-primary",
  },
  fully_booked: {
    Icon: CalendarX2,
    tone: "bg-amber-50/60 dark:bg-amber-500/10",
    border: "border-amber-500/30",
    iconColor: "text-amber-600",
  },
  offer_alternative: {
    Icon: AlertTriangle,
    tone: "bg-amber-50/60 dark:bg-amber-500/10",
    border: "border-amber-500/30",
    iconColor: "text-amber-600",
  },
  no_spaces: {
    Icon: PackageOpen,
    tone: "bg-muted/50",
    border: "border-border/70",
    iconColor: "text-muted-foreground",
  },
};

const CONFLICT_LABEL: Record<NonNullable<SpaceConflict["blockKind"]>, string> = {
  hold: "On hold",
  confirmed: "Booked",
  blackout: "Blackout",
};

export function AvailabilityChecker({
  hasSpaces,
  defaultDate,
}: {
  hasSpaces: boolean;
  /** Sensible default for the date input (an upcoming demo/booking date). */
  defaultDate?: string;
}) {
  const [state, action, pending] = useActionState<AvailabilityState, FormData>(
    checkAvailabilityAction,
    { status: "idle" },
  );

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="size-4 text-primary" />
          Availability checker
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Date + guests + event type → the spaces and packages you can offer
          right now.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <form action={action} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="date">Event date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={defaultDate}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guestCount">Guests</Label>
            <Input
              id="guestCount"
              name="guestCount"
              type="number"
              min={1}
              required
              placeholder="500"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eventType">Event type</Label>
            {/* Select state mirrored into a hidden field for the form action. */}
            <EventTypeField />
          </div>

          <div className="sm:col-span-3">
            <Button type="submit" disabled={pending} className="w-full sm:w-auto">
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Checking…
                </>
              ) : (
                <>
                  Check availability <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </form>

        {state.status === "error" && (
          <p className="text-sm text-red-600">{state.message}</p>
        )}

        {state.status === "success" && (
          <AvailabilityReport result={state.result} hasSpaces={hasSpaces} />
        )}
      </CardContent>
    </Card>
  );
}

function EventTypeField() {
  const [value, setValue] = React.useState<string>("wedding");
  return (
    <>
      <input type="hidden" name="eventType" value={value} />
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {EVENT_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {EVENT_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

function AvailabilityReport({
  result,
  hasSpaces,
}: {
  result: AvailabilityResult;
  hasSpaces: boolean;
}) {
  const meta = NEXT_STEP_META[result.nextStep.kind];
  const canHold = result.nextStep.kind === "place_hold";

  return (
    <div className="space-y-5 border-t pt-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{formatDate(result.date)}</span>
        <span className="text-muted-foreground">·</span>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Users className="size-3.5" /> {result.guestCount.toLocaleString("en-IN")}{" "}
          guests
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="capitalize text-muted-foreground">
          {EVENT_TYPE_LABELS[result.eventType] ?? result.eventType}
        </span>
        <Badge
          variant={result.freeSpaces.length > 0 ? "default" : "secondary"}
          className="ml-auto"
        >
          {result.freeSpaces.length > 0
            ? `${result.freeSpaces.length} space${result.freeSpaces.length > 1 ? "s" : ""} free`
            : "No free fit"}
        </Badge>
      </div>

      {/* Free spaces */}
      {result.freeSpaces.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Available spaces
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {result.freeSpaces.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-50/50 p-3 dark:bg-emerald-500/10"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Up to {s.capacity.toLocaleString("en-IN")} guests
                  </p>
                </div>
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matching packages */}
      {result.matchingPackages.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Packages to quote
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {result.matchingPackages.map((p) => (
              <PackageCard key={p.id} pkg={p} />
            ))}
          </div>
        </div>
      )}

      {/* Conflicts */}
      {result.conflictingSpaces.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Not available
          </p>
          <div className="divide-y rounded-lg border border-border/70">
            {result.conflictingSpaces.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.reason === "capacity"
                      ? `Fits ${c.capacity.toLocaleString("en-IN")} — too small for this party`
                      : "Occupied on this date"}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {c.reason === "capacity"
                    ? "Too small"
                    : CONFLICT_LABEL[c.blockKind ?? "hold"]}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested next step */}
      <div
        className={cn("rounded-lg border p-4", meta.tone, meta.border)}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/70",
              meta.iconColor,
            )}
          >
            <meta.Icon className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{result.nextStep.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {result.nextStep.detail}
            </p>
            {canHold && hasSpaces && <PlaceHoldButton date={result.date} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceHoldButton({ date }: { date: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      className="mt-3"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const fd = new FormData();
          fd.set("eventDate", date);
          fd.set("couple", "Availability enquiry");
          const r = await placeHoldAction(null, fd);
          if (r.ok) toast.success(r.message);
          else toast.error(r.message);
        })
      }
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Lock className="size-3.5" />
      )}
      Place a hold
    </Button>
  );
}

function PackageCard({ pkg }: { pkg: MatchingPackage }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        pkg.matchesEventType ? "border-border/70" : "border-dashed border-border/70",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{pkg.name}</p>
        {pkg.matchesEventType && (
          <Badge variant="secondary" className="text-[10px]">
            Best fit
          </Badge>
        )}
      </div>
      <p className="mt-1 text-sm font-semibold tabular-nums">
        {formatINRShort(pkg.priceMin)}
        {pkg.priceMax ? ` – ${formatINRShort(pkg.priceMax)}` : ""}
      </p>
      {pkg.perPlate ? (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
          <IndianRupee className="size-3" />
          {pkg.perPlate.toLocaleString("en-IN")}/plate
        </p>
      ) : null}
      {pkg.estimatedSpend ? (
        <p className="mt-1.5 border-t pt-1.5 text-xs text-muted-foreground">
          Est. for this party:{" "}
          <span className="font-medium text-foreground tabular-nums">
            {formatINRShort(pkg.estimatedSpend)}
          </span>
        </p>
      ) : null}
    </div>
  );
}
