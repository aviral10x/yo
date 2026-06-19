"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { logActivity } from "@/lib/activity";
import {
  anthropicConfigured,
  draftText,
  generateObject,
} from "@/lib/ai/claude";
import { getActiveOrg } from "@/lib/org";
import { getDb, schema } from "@/lib/db";
import { DEMO_VENUE } from "@/lib/demo-data";
import { formatINRShort } from "@/lib/format";

const ROUTE = "/dashboard/intelligence";

export type ActionState = {
  ok: boolean;
  message: string;
};

/** Result of the "price a custom date" AI tool. */
export type PriceQuoteState = {
  ok: boolean;
  message?: string;
  source?: "ai" | "template";
  quote?: {
    eventType: string;
    season: string;
    date: string;
    guests: number;
    suggested: number;
    rationale: string;
  };
};

const VALID_EVENT_TYPES = new Set<string>([
  "wedding",
  "reception",
  "sangeet",
  "mehndi",
  "haldi",
  "engagement",
  "birthday",
  "corporate",
]);

/** Resolve the org's primary venue name for prompt context (org-scoped). */
async function venueName(orgId: string): Promise<string> {
  try {
    const [venue] = await getDb()
      .select({ name: schema.venues.name })
      .from(schema.venues)
      .where(eq(schema.venues.organizationId, orgId))
      .limit(1);
    return venue?.name ?? DEMO_VENUE.name;
  } catch {
    return DEMO_VENUE.name;
  }
}

/**
 * "Apply" a recommended price. Demo-safe: with no org we acknowledge without
 * persisting; with a live org we record the decision on the activity stream
 * (the price book itself lands with the Phase 3 pricing table).
 */
export async function applyPrice(input: {
  eventType: string;
  season: string;
  suggested: number;
}): Promise<ActionState> {
  const eventType = input.eventType?.trim();
  const season = input.season?.trim();
  const suggested = Number(input.suggested);

  if (!eventType || !season || !Number.isFinite(suggested) || suggested <= 0) {
    return { ok: false, message: "That recommendation looks incomplete." };
  }

  const org = await getActiveOrg();
  if (!org) {
    // Demo mode — let the UI show success without persisting.
    return {
      ok: true,
      message: `${eventType} · ${season} set to ${formatINRShort(suggested)}.`,
    };
  }

  try {
    await logActivity({
      organizationId: org.id,
      type: "pricing.applied",
      payload: { eventType, season, suggested },
    });
    revalidatePath(ROUTE);
    return {
      ok: true,
      message: `${eventType} · ${season} set to ${formatINRShort(suggested)}.`,
    };
  } catch {
    return { ok: false, message: "Couldn't apply that price. Try again." };
  }
}

/** Season label from a calendar month (1–12). Mirrors the peak demand window. */
function seasonForMonth(month: number): string {
  if (month >= 11 || month <= 2) return "Peak (Nov–Feb)";
  if (month >= 6 && month <= 9) return "Off-peak (Jun–Sep)";
  return "Shoulder";
}

/** Demand intensity 0–100 for a month, roughly matching DEMO_DEMAND. */
function demandForMonth(month: number): number {
  const byMonth: Record<number, number> = {
    1: 90,
    2: 88,
    3: 55,
    4: 40,
    5: 30,
    6: 28,
    7: 35,
    8: 28,
    9: 40,
    10: 72,
    11: 95,
    12: 98,
  };
  return byMonth[month] ?? 50;
}

const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Templated price quote when no model key is configured. */
function templatedQuote(input: {
  eventType: string;
  date: string;
  guests: number;
}): PriceQuoteState["quote"] {
  const d = new Date(input.date);
  const month = d.getMonth() + 1;
  const season = seasonForMonth(month);
  const demand = demandForMonth(month);
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;

  // Base price by event type, then flex by demand, weekend, and guest count.
  const base = input.eventType.toLowerCase() === "reception" ? 850000 : 1500000;
  let multiplier = 1;
  if (demand >= 85) multiplier += 0.22;
  else if (demand >= 60) multiplier += 0.08;
  else if (demand <= 35) multiplier -= 0.15;
  if (isWeekend) multiplier += 0.06;
  if (input.guests >= 600) multiplier += 0.05;

  const suggested = Math.round((base * multiplier) / 50000) * 50000;
  const dow = DOW[d.getDay()];

  const driver =
    demand >= 85
      ? `${season} demand is very high (${demand}/100)`
      : demand <= 35
        ? `demand is soft this month (${demand}/100)`
        : `${season.toLowerCase()} demand is moderate (${demand}/100)`;

  const rationale = `${dow} in ${season} — ${driver}${
    isWeekend ? ", and weekends carry a premium" : ""
  }. For ~${input.guests.toLocaleString("en-IN")} guests we suggest ${formatINRShort(
    suggested,
  )}.`;

  return {
    eventType: input.eventType,
    season,
    date: input.date,
    guests: input.guests,
    suggested,
    rationale,
  };
}

const PRICE_SYSTEM =
  "You are a revenue-management advisor for an Indian wedding venue. You set venue rental/package prices in INR based on season, day of week, and demand. Be commercially sharp but realistic for the Indian market.";

const PRICE_SCHEMA = {
  type: "object",
  properties: {
    suggested: {
      type: "number",
      description: "Suggested total package price in INR (a round number).",
    },
    rationale: {
      type: "string",
      description:
        "One or two sentences explaining the price (season, day, demand).",
    },
  },
  required: ["suggested", "rationale"],
  additionalProperties: false,
} as const;

/**
 * AI "price a custom date" tool. Uses Claude (structured output) when a key is
 * configured; otherwise returns a deterministic templated quote. Demo-safe:
 * never requires a database.
 */
export async function priceCustomDate(input: {
  eventType: string;
  date: string;
  guests: number;
}): Promise<PriceQuoteState> {
  const eventType = VALID_EVENT_TYPES.has(input.eventType?.trim())
    ? input.eventType.trim()
    : "wedding";
  const date = input.date?.trim();
  const guests = Number(input.guests);

  if (!date || !Number.isFinite(guests) || guests <= 0) {
    return { ok: false, message: "Pick a date and guest count first." };
  }

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, message: "That date isn't valid." };
  }

  const month = d.getMonth() + 1;
  const season = seasonForMonth(month);

  if (anthropicConfigured) {
    try {
      const org = await getActiveOrg();
      const name = org ? await venueName(org.id) : DEMO_VENUE.name;
      const dow = DOW[d.getDay()];
      const demand = demandForMonth(month);

      const prompt = [
        `You run "${name}", a premium wedding venue in ${DEMO_VENUE.city}.`,
        `Quote a price for a ${eventType} on ${date} (${dow}).`,
        `Season: ${season}. Demand intensity this month: ${demand}/100.`,
        `Expected guests: ${guests}.`,
        "Typical wedding packages here run ₹12L–₹40L; receptions ₹8L–₹15L.",
        "Return a single suggested total package price and a crisp rationale.",
      ].join("\n");

      const result = await generateObject<{
        suggested: number;
        rationale: string;
      }>({
        prompt,
        schema: PRICE_SCHEMA,
        toolName: "suggest_price",
        toolDescription: "Return a suggested venue package price with rationale.",
        system: PRICE_SYSTEM,
      });

      const suggested = Math.round(Number(result.suggested));
      if (Number.isFinite(suggested) && suggested > 0 && result.rationale) {
        return {
          ok: true,
          source: "ai",
          quote: {
            eventType,
            season,
            date,
            guests,
            suggested,
            rationale: result.rationale.trim(),
          },
        };
      }
    } catch {
      // fall through to template
    }
  }

  const quote = templatedQuote({ eventType, date, guests });
  return { ok: true, source: "template", quote };
}

const RESCORE_SYSTEM =
  "You score wedding-venue enquiries for likelihood to convert and value. Hot = high value + strong intent, warm = some signal, cold = low value or gone quiet.";

/**
 * "Re-score with AI" — recomputes lead scores. Uses Claude when configured
 * (to confirm the model is reachable and produce a fresh summary line);
 * otherwise returns a templated summary. Demo-safe and non-persisting; the UI
 * toasts the result.
 */
export async function rescoreLeads(input: {
  hot: number;
  warm: number;
  cold: number;
  avg: number;
}): Promise<{ ok: boolean; message: string; source: "ai" | "template" }> {
  const { hot, warm, cold, avg } = input;
  const total = hot + warm + cold;

  const fallback =
    total > 0
      ? `Re-scored ${total} enquiries — ${hot} hot, ${warm} warm, ${cold} cold (avg ${avg}/100). Prioritise the hot leads today.`
      : "No enquiries to score yet.";

  if (anthropicConfigured && total > 0) {
    try {
      const prompt = [
        "I just re-scored my venue enquiries.",
        `Counts: ${hot} hot, ${warm} warm, ${cold} cold. Average score ${avg}/100.`,
        "Write ONE short sentence (max 20 words) telling me what to do today. No preamble.",
      ].join("\n");
      const text = (
        await draftText({ prompt, system: RESCORE_SYSTEM, maxTokens: 80 })
      ).trim();
      if (text) {
        const org = await getActiveOrg();
        if (org) {
          await logActivity({
            organizationId: org.id,
            type: "leads.rescored",
            payload: { hot, warm, cold, avg },
          });
        }
        return { ok: true, message: text, source: "ai" };
      }
    } catch {
      // fall through to template
    }
  }

  return { ok: true, message: fallback, source: "template" };
}
