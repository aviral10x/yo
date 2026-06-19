import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, Search, Sparkles, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FiltersBar, type FilterOption } from "@/components/discovery/filters-bar";
import { VenueCard, type DiscoveryVenue } from "@/components/discovery/venue-card";
import { VENUE_TYPE_LABELS } from "@/lib/constants";
import { DEMO_DISCOVERY_VENUES } from "@/lib/demo-data";
import { appUrl } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Find your wedding venue",
  description:
    "Browse premium wedding lawns, banquet halls, resorts and farmhouses across India. Filter by city, venue type, guest capacity and budget — and enquire directly with the venue.",
};

/** First defined value from a possibly-repeated searchParam. */
function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const selected = {
    city: first(sp.city),
    type: first(sp.type),
    capacity: first(sp.capacity),
    budget: first(sp.budget),
  };

  const venues = DEMO_DISCOVERY_VENUES as DiscoveryVenue[];

  // Build filter options from the dataset so they always reflect what's listed.
  const cityOptions: FilterOption[] = Array.from(
    new Set(venues.map((v) => v.city)),
  )
    .sort((a, b) => a.localeCompare(b))
    .map((city) => ({ value: city, label: city }));

  const typeOptions: FilterOption[] = Array.from(
    new Set(venues.map((v) => v.type)),
  ).map((type) => ({
    value: type,
    label: VENUE_TYPE_LABELS[type] ?? type,
  }));

  // Server-side filtering from searchParams.
  const minCapacity = Number(selected.capacity) || 0;
  const maxBudget = Number(selected.budget) || 0;
  const results = venues.filter((v) => {
    if (selected.city && v.city !== selected.city) return false;
    if (selected.type && v.type !== selected.type) return false;
    if (minCapacity && v.capacity < minCapacity) return false;
    if (maxBudget && v.priceFrom > maxBudget) return false;
    return true;
  });

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid text-border/60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-5xl px-6 py-16 text-center sm:py-20">
          <Badge variant="secondary" className="mb-5 gap-1.5">
            <Sparkles className="size-3.5 text-primary" /> {venues.length}{" "}
            handpicked venues across India
          </Badge>
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Find your <span className="text-primary">wedding venue</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
            Discover premium lawns, banquet halls, resorts and farmhouses — then
            check dates and enquire directly with the venue. No middlemen, no
            markups.
          </p>
        </div>
      </section>

      {/* Filters + results */}
      <section className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
        <FiltersBar
          cities={cityOptions}
          types={typeOptions}
          selected={selected}
        />

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">
              {results.length}
            </span>{" "}
            {results.length === 1 ? "venue" : "venues"}
            {selected.city ? (
              <>
                {" "}
                in <span className="font-medium text-foreground">{selected.city}</span>
              </>
            ) : null}
          </p>
        </div>

        {results.length > 0 ? (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((venue) => (
              <VenueCard key={venue.slug} venue={venue} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>

      {/* List-your-venue CTA band */}
      <section className="border-t bg-emerald-950 text-emerald-50">
        <div className="relative mx-auto max-w-6xl overflow-hidden px-6 py-16">
          <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
            <div className="max-w-xl">
              <Badge className="mb-4 gap-1.5 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/20">
                <Store className="size-3.5" /> For venue owners
              </Badge>
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                List your venue on VenuePilot
              </h2>
              <p className="mt-3 text-pretty text-emerald-100/80">
                Get discovered by couples, capture enquiries directly, and run
                every booking — from first message to final event — with the
                AI-first operating system built for Indian wedding venues.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary" className="shrink-0">
              <a href={`${appUrl}/sign-up`}>
                List your venue <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Search className="size-5" />
      </span>
      <h3 className="mt-4 text-lg font-semibold">No venues match your filters</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Try widening your guest capacity or budget, or exploring a different
        city to see more options.
      </p>
      <Button asChild variant="outline" className="mt-5">
        <Link href="/venues">
          <MapPin className="size-4" /> Clear filters
        </Link>
      </Button>
    </div>
  );
}
