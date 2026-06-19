import { EVENT_TYPE_LABELS } from "@/lib/constants";

/**
 * Normalized shapes consumed by the inventory client components. Both live DB
 * rows and demo rows are mapped to these on the server, so the interactive UI
 * never has to branch on the data source (mirrors the leads slice).
 */

export type SpaceKind = "lawn" | "hall" | "room_block" | "combo";

export type SpaceRow = {
  id: string;
  name: string;
  kind: SpaceKind;
  seatedCapacity: number | null;
  floatingCapacity: number | null;
  notes: string | null;
};

export type RoomRow = {
  id: string;
  name: string;
  count: number;
  tariff: number;
};

export type PackageRow = {
  id: string;
  name: string;
  eventTypes: string[];
  inclusions: string[];
  priceMin: number | null;
  priceMax: number | null;
  perPlate: number | null;
  active: boolean;
};

/** Result shape returned by every inventory server action. */
export type ActionState = {
  ok: boolean;
  message: string;
};

/** Space kinds offered when adding/editing a space. */
export const SPACE_KINDS: { value: SpaceKind; label: string }[] = [
  { value: "lawn", label: "Lawn / open-air" },
  { value: "hall", label: "Banquet hall" },
  { value: "room_block", label: "Room block" },
  { value: "combo", label: "Combo (indoor + outdoor)" },
];

export const SPACE_KIND_LABEL: Record<SpaceKind, string> = Object.fromEntries(
  SPACE_KINDS.map((k) => [k.value, k.label]),
) as Record<SpaceKind, string>;

/** Visual tone per space kind — warm, light-first, emerald-leaning. */
export const SPACE_KIND_TONE: Record<SpaceKind, { dot: string; badge: string }> =
  {
    lawn: {
      dot: "bg-emerald-500",
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },
    hall: {
      dot: "bg-violet-500",
      badge: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
    },
    room_block: {
      dot: "bg-sky-500",
      badge: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
    },
    combo: {
      dot: "bg-amber-500",
      badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
  };

/** Event types a package can cover (the wedding-relevant subset). */
export const PACKAGE_EVENT_TYPES = [
  "wedding",
  "reception",
  "sangeet",
  "mehndi",
  "haldi",
  "engagement",
  "birthday",
  "corporate",
] as const;

export function eventTypeLabel(value: string): string {
  return EVENT_TYPE_LABELS[value] ?? value;
}
