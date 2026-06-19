/**
 * Availability + space/package matching engine.
 *
 * Answers the five instant questions a venue owner gets a hundred times a week:
 *   "Is <date> free? For <guests>? For a <event type>? What can I offer? What next?"
 *
 * Data pattern (mirrors the rest of the app): when there is an active org we
 * read live `spaces` / `calendar_blocks` / `packages` scoped to that org;
 * otherwise we fall back to the demo dataset so the feature renders + works
 * with no database connected.
 *
 *   A space is FREE on a date  ⇔  its capacity ≥ guestCount
 *                                AND it has no calendar_block on that date.
 *   A space is CONFLICTING     ⇔  it has a block on that date (regardless of cap)
 *                                OR its capacity is too small for the party.
 */
import "server-only";

import { and, eq } from "drizzle-orm";

import { getDb, schema } from "@/lib/db";
import {
  DEMO_CALENDAR,
  DEMO_PACKAGES,
  DEMO_SPACES,
} from "@/lib/demo-data";
import { getActiveOrg } from "@/lib/org";

export type BlockKind = "hold" | "confirmed" | "blackout";

/** A space normalized across the demo + live shapes. */
export type AvailabilitySpace = {
  id: string;
  name: string;
  kind: string;
  /** Best-fit capacity used for matching (floating preferred, else seated). */
  capacity: number;
  seated: number | null;
  floating: number | null;
};

/** A space that cannot host the party, with the reason why. */
export type SpaceConflict = AvailabilitySpace & {
  /** "booked" → occupied that day; "capacity" → too small for the party. */
  reason: "booked" | "capacity";
  /** The block kind when reason === "booked". */
  blockKind?: BlockKind;
};

export type MatchingPackage = {
  id: string;
  name: string;
  eventTypes: string[];
  priceMin: number | null;
  priceMax: number | null;
  perPlate: number | null;
  /** Indicative spend for this party = perPlate × guests (when both known). */
  estimatedSpend: number | null;
  /** True when this package explicitly lists the requested event type. */
  matchesEventType: boolean;
};

export type NextStep = {
  /** A short machine label callers can branch on. */
  kind: "place_hold" | "offer_alternative" | "fully_booked" | "no_spaces";
  title: string;
  detail: string;
};

export type AvailabilityResult = {
  date: string;
  guestCount: number;
  eventType: string;
  freeSpaces: AvailabilitySpace[];
  conflictingSpaces: SpaceConflict[];
  matchingPackages: MatchingPackage[];
  nextStep: NextStep;
};

export type FindAvailabilityInput = {
  date: string;
  guestCount: number;
  eventType: string;
};

const toNum = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
};

/** Capacity used for matching — floating (standing) preferred, else seated. */
const bestCapacity = (
  seated: number | null,
  floating: number | null,
): number => Math.max(floating ?? 0, seated ?? 0);

/**
 * Resolve the available spaces, packages and recommended next step for a date.
 * Always returns a fully-populated result — demo-backed when there is no org.
 */
export async function findAvailability(
  input: FindAvailabilityInput,
): Promise<AvailabilityResult> {
  const date = input.date;
  const guestCount = Math.max(0, Math.floor(input.guestCount || 0));
  const eventType = input.eventType || "wedding";

  const org = await getActiveOrg();

  let spaces: AvailabilitySpace[];
  let blocksBySpace: Map<string, BlockKind>;
  let packages: Omit<MatchingPackage, "estimatedSpend" | "matchesEventType">[];

  if (org) {
    const db = getDb();
    const [spaceRows, blockRows, packageRows] = await Promise.all([
      db
        .select()
        .from(schema.spaces)
        .where(eq(schema.spaces.organizationId, org.id)),
      db
        .select()
        .from(schema.calendarBlocks)
        .where(
          and(
            eq(schema.calendarBlocks.organizationId, org.id),
            eq(schema.calendarBlocks.date, date),
          ),
        ),
      db
        .select()
        .from(schema.packages)
        .where(
          and(
            eq(schema.packages.organizationId, org.id),
            eq(schema.packages.active, true),
          ),
        ),
    ]);

    spaces = spaceRows.map((s) => ({
      id: s.id,
      name: s.name,
      kind: s.kind,
      seated: s.seatedCapacity ?? null,
      floating: s.floatingCapacity ?? null,
      capacity: bestCapacity(s.seatedCapacity ?? null, s.floatingCapacity ?? null),
    }));
    blocksBySpace = new Map(blockRows.map((b) => [b.spaceId, b.kind]));
    packages = packageRows.map((p) => ({
      id: p.id,
      name: p.name,
      eventTypes: (p.eventTypes ?? []) as string[],
      priceMin: toNum(p.priceMin),
      priceMax: toNum(p.priceMax),
      perPlate: toNum(p.perPlate),
    }));
  } else {
    spaces = DEMO_SPACES.map((s) => ({
      id: s.id,
      name: s.name,
      kind: s.kind,
      seated: s.seated,
      floating: s.floating,
      capacity: bestCapacity(s.seated, s.floating),
    }));
    blocksBySpace = new Map(
      DEMO_CALENDAR.filter((c) => c.date === date).map((c) => [c.spaceId, c.kind]),
    );
    packages = DEMO_PACKAGES.map((p) => ({
      id: p.id,
      name: p.name,
      eventTypes: p.eventTypes,
      priceMin: p.priceMin,
      priceMax: p.priceMax,
      perPlate: p.perPlate,
    }));
  }

  const freeSpaces: AvailabilitySpace[] = [];
  const conflictingSpaces: SpaceConflict[] = [];

  for (const space of spaces) {
    const blockKind = blocksBySpace.get(space.id);
    if (blockKind) {
      conflictingSpaces.push({ ...space, reason: "booked", blockKind });
    } else if (guestCount > 0 && space.capacity < guestCount) {
      conflictingSpaces.push({ ...space, reason: "capacity" });
    } else {
      freeSpaces.push(space);
    }
  }

  // Largest-first so the most flexible option leads.
  freeSpaces.sort((a, b) => b.capacity - a.capacity);

  // Packages: surface event-type matches first, then by entry price.
  const matchingPackages: MatchingPackage[] = packages
    .map((p) => ({
      ...p,
      matchesEventType:
        p.eventTypes.length === 0 || p.eventTypes.includes(eventType),
      estimatedSpend:
        p.perPlate && guestCount > 0 ? p.perPlate * guestCount : null,
    }))
    .sort((a, b) => {
      if (a.matchesEventType !== b.matchesEventType)
        return a.matchesEventType ? -1 : 1;
      return (a.priceMin ?? Infinity) - (b.priceMin ?? Infinity);
    });

  const nextStep = deriveNextStep({
    freeSpaces,
    conflictingSpaces,
    totalSpaces: spaces.length,
  });

  return {
    date,
    guestCount,
    eventType,
    freeSpaces,
    conflictingSpaces,
    matchingPackages,
    nextStep,
  };
}

function deriveNextStep({
  freeSpaces,
  conflictingSpaces,
  totalSpaces,
}: {
  freeSpaces: AvailabilitySpace[];
  conflictingSpaces: SpaceConflict[];
  totalSpaces: number;
}): NextStep {
  if (totalSpaces === 0) {
    return {
      kind: "no_spaces",
      title: "Add your spaces first",
      detail:
        "No spaces are set up yet. Add your lawns and halls with capacities to start checking availability.",
    };
  }

  if (freeSpaces.length > 0) {
    const top = freeSpaces[0];
    return {
      kind: "place_hold",
      title: "Place a provisional hold",
      detail: `${top.name} fits this party — hold it for 48 hours and send the couple a deposit link to lock the date.`,
    };
  }

  const allBooked =
    conflictingSpaces.length > 0 &&
    conflictingSpaces.every((c) => c.reason === "booked");

  if (allBooked) {
    return {
      kind: "fully_booked",
      title: "Fully booked — offer a nearby date",
      detail:
        "Every space is occupied on this date. Propose an alternative date or join the waitlist in case a hold lapses.",
    };
  }

  return {
    kind: "offer_alternative",
    title: "No fit for this party size",
    detail:
      "Spaces are free but too small for this guest count. Suggest a combined setup, an off-peak date, or your largest lawn for a floating layout.",
  };
}
