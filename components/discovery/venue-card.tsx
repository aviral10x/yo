import Image from "next/image";
import { MapPin, Star, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { VENUE_TYPE_LABELS } from "@/lib/constants";
import { formatINRShort } from "@/lib/format";
import { venueUrl } from "@/lib/urls";

export type DiscoveryVenue = {
  slug: string;
  name: string;
  city: string;
  state: string;
  type: string;
  capacity: number;
  priceFrom: number;
  rating: number;
  reviews: number;
  image: string;
};

export function VenueCard({ venue }: { venue: DiscoveryVenue }) {
  const typeLabel = VENUE_TYPE_LABELS[venue.type] ?? "Wedding Venue";

  return (
    <a
      href={venueUrl(venue.slug)}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={venue.image}
          alt={`${venue.name} — ${typeLabel} in ${venue.city}`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <Badge
          variant="secondary"
          className="absolute left-3 top-3 bg-background/90 backdrop-blur-sm"
        >
          {typeLabel}
        </Badge>
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium shadow-sm backdrop-blur-sm">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          <span className="tabular-nums">{venue.rating.toFixed(1)}</span>
          <span className="text-muted-foreground">({venue.reviews})</span>
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-primary">
          {venue.name}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          {venue.city}, {venue.state}
        </p>

        <div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-4 shrink-0 text-primary/80" />
          Up to{" "}
          <span className="font-medium text-foreground tabular-nums">
            {venue.capacity.toLocaleString("en-IN")}
          </span>{" "}
          guests
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-border/60 pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Starting from</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatINRShort(venue.priceFrom)}
            </p>
          </div>
          <span className="text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            View venue →
          </span>
        </div>
      </div>
    </a>
  );
}
