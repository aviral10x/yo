import { LEAD_STAGES } from "@/lib/constants";

/** Stage value union, derived from the canonical pipeline constant. */
export type LeadStage = (typeof LEAD_STAGES)[number]["value"];

/**
 * Normalized lead shape consumed by every client component in this slice.
 * Both live DB rows and demo rows are mapped to this on the server so the
 * interactive UI never has to branch on the data source.
 */
export type LeadRow = {
  id: string;
  coupleName: string;
  phone: string;
  email?: string;
  source: string;
  eventType: string;
  dateRequested: string | null;
  guestCount: number | null;
  stage: LeadStage;
  createdAt: string;
};

/** Visual tone per pipeline stage — mirrors the overview dashboard. */
export const STAGE_TONE: Record<LeadStage, { dot: string; badge: string }> = {
  new: {
    dot: "bg-sky-500",
    badge: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  qualified: {
    dot: "bg-indigo-500",
    badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  },
  site_visit: {
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  quoted: {
    dot: "bg-violet-500",
    badge: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
  hold: {
    dot: "bg-orange-500",
    badge: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  },
  deposit: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  confirmed: {
    dot: "bg-emerald-600",
    badge: "bg-emerald-600/10 text-emerald-800 dark:text-emerald-400",
  },
  lost: {
    dot: "bg-muted-foreground/40",
    badge: "bg-muted text-muted-foreground",
  },
};

export const STAGE_LABEL: Record<LeadStage, string> = Object.fromEntries(
  LEAD_STAGES.map((s) => [s.value, s.label]),
) as Record<LeadStage, string>;
