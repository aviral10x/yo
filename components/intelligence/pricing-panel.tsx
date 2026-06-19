"use client";

import * as React from "react";
import { useTransition } from "react";
import {
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import {
  applyPrice,
  priceCustomDate,
  type PriceQuoteState,
} from "@/app/dashboard/(panel)/intelligence/actions";
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
import { formatDate, formatINR, formatINRShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PriceRec } from "./types";

const QUOTE_EVENT_TYPES = [
  "wedding",
  "reception",
  "sangeet",
  "engagement",
] as const;

export function PricingPanel({ recs }: { recs: PriceRec[] }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {recs.map((rec) => (
          <PriceCard key={`${rec.eventType}-${rec.season}`} rec={rec} />
        ))}
      </div>
      <CustomDateTool />
    </div>
  );
}

function ChangeBadge({ change }: { change: number }) {
  const up = change >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        up
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
          : "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
      )}
    >
      {up ? (
        <TrendingUp className="size-3" />
      ) : (
        <TrendingDown className="size-3" />
      )}
      {up ? "+" : ""}
      {change}%
    </span>
  );
}

function PriceCard({ rec }: { rec: PriceRec }) {
  const [pending, start] = useTransition();
  const [applied, setApplied] = React.useState(false);

  function handleApply() {
    start(async () => {
      const result = await applyPrice({
        eventType: rec.eventType,
        season: rec.season,
        suggested: rec.suggested,
      });
      if (result.ok) {
        setApplied(true);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Card className="border-border/70 flex flex-col">
      <CardHeader className="gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{rec.eventType}</CardTitle>
          <ChangeBadge change={rec.change} />
        </div>
        <p className="text-xs text-muted-foreground">{rec.season}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex items-end gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-lg font-medium text-muted-foreground line-through tabular-nums">
              {formatINRShort(rec.current)}
            </p>
          </div>
          <ArrowRight className="mb-1.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs text-primary">Suggested</p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatINRShort(rec.suggested)}
            </p>
          </div>
        </div>

        <p className="flex-1 text-sm text-muted-foreground">{rec.rationale}</p>

        <Button
          onClick={handleApply}
          disabled={pending || applied}
          variant={applied ? "outline" : "default"}
          className="w-full"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Applying…
            </>
          ) : applied ? (
            <>
              <Check className="size-4" /> Applied
            </>
          ) : (
            <>Apply price</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function CustomDateTool() {
  const [eventType, setEventType] = React.useState<string>("wedding");
  const [date, setDate] = React.useState("");
  const [guests, setGuests] = React.useState("");
  const [pending, start] = useTransition();
  const [result, setResult] = React.useState<PriceQuoteState | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await priceCustomDate({
        eventType,
        date,
        guests: Number(guests),
      });
      setResult(res);
      if (!res.ok) toast.error(res.message ?? "Couldn't price that date.");
    });
  }

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wand2 className="size-4 text-primary" />
          AI: price a custom date
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pick a date, event, and guest count — get a suggested price with the
          reasoning behind it.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <div className="space-y-1.5">
            <Label htmlFor="quote-date">Event date</Label>
            <Input
              id="quote-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quote-event">Event type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger id="quote-event" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUOTE_EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {EVENT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quote-guests">Guests</Label>
            <Input
              id="quote-guests"
              type="number"
              min={1}
              required
              placeholder="500"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={pending}
              className="w-full sm:w-auto"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Pricing…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Suggest
                </>
              )}
            </Button>
          </div>
        </form>

        {result?.ok && result.quote && (
          <QuoteResult quote={result.quote} source={result.source} />
        )}
      </CardContent>
    </Card>
  );
}

function QuoteResult({
  quote,
  source,
}: {
  quote: NonNullable<PriceQuoteState["quote"]>;
  source?: "ai" | "template";
}) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Suggested price</span>
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Sparkles className="size-2.5" />
          {source === "ai" ? "AI" : "Estimate"}
        </Badge>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {formatDate(quote.date)} · {quote.guests.toLocaleString("en-IN")} guests
        </span>
      </div>
      <p className="mt-1 text-3xl font-semibold tabular-nums">
        {formatINR(quote.suggested)}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-[10px]">
          {quote.season}
        </Badge>
        <span className="text-xs capitalize text-muted-foreground">
          {EVENT_TYPE_LABELS[quote.eventType] ?? quote.eventType}
        </span>
      </div>
      <p className="mt-2.5 border-t border-primary/20 pt-2.5 text-sm text-muted-foreground">
        {quote.rationale}
      </p>
    </div>
  );
}
