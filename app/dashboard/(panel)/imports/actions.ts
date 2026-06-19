"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { logActivity } from "@/lib/activity";
import { anthropicConfigured, generateObject } from "@/lib/ai/claude";
import { getActiveOrg } from "@/lib/org";
import { getDb, schema } from "@/lib/db";
import type {
  ImportLeadResult,
  ParsedEnquiry,
  ParseEnquiryResult,
} from "@/components/imports/import-types";

const ROUTE = "/dashboard/imports";

const VALID_SOURCES = new Set<string>([
  "direct",
  "whatsapp",
  "wedmegood",
  "weddingz",
  "venuelook",
  "walkin",
  "referral",
  "other",
]);
const VALID_EVENT_TYPES = new Set<string>([
  "wedding",
  "reception",
  "sangeet",
  "mehndi",
  "haldi",
  "engagement",
  "birthday",
  "corporate",
  "other",
]);

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

const SYSTEM =
  "You extract structured lead data from raw wedding-venue marketplace enquiries " +
  "(WedMeGood, Weddingz, VenueLook, email forwards, WhatsApp pastes). " +
  "Indian context: names are often 'Couple A & Couple B', phones carry +91, " +
  "dates come in many formats. Map the originating marketplace to the source. " +
  "Return your answer strictly via the provided tool — never guess wildly; " +
  "leave a field empty if it is genuinely not present.";

const ENQUIRY_SCHEMA = {
  type: "object",
  properties: {
    coupleName: {
      type: "string",
      description: "The couple's or contact's name. Empty string if absent.",
    },
    phone: {
      type: "string",
      description: "Phone number as written (keep +91 / spacing). Empty if absent.",
    },
    email: { type: "string", description: "Email address, or empty string." },
    eventType: {
      type: "string",
      enum: [
        "wedding",
        "reception",
        "sangeet",
        "mehndi",
        "haldi",
        "engagement",
        "birthday",
        "corporate",
        "other",
      ],
      description: "Best-fit event type. Default 'wedding' for a wedding enquiry.",
    },
    date: {
      type: "string",
      description:
        "Requested event date in ISO yyyy-mm-dd if you can resolve it; else the raw text; else empty.",
    },
    guestCount: {
      type: "string",
      description: "Guest count as a plain number string (e.g. '550'), or empty.",
    },
    city: { type: "string", description: "City, or empty string." },
    source: {
      type: "string",
      enum: ["wedmegood", "weddingz", "venuelook", "referral", "whatsapp", "other"],
      description:
        "The originating marketplace/channel inferred from the text header. Use 'other' if unclear.",
    },
  },
  required: [
    "coupleName",
    "phone",
    "email",
    "eventType",
    "date",
    "guestCount",
    "city",
    "source",
  ],
} as const;

const EVENT_KEYWORDS: [string, string][] = [
  ["reception", "reception"],
  ["sangeet", "sangeet"],
  ["mehndi", "mehndi"],
  ["mehendi", "mehndi"],
  ["haldi", "haldi"],
  ["engagement", "engagement"],
  ["roka", "engagement"],
  ["birthday", "birthday"],
  ["corporate", "corporate"],
  ["wedding", "wedding"],
  ["shaadi", "wedding"],
];

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function detectSource(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("wedmegood")) return "wedmegood";
  if (t.includes("weddingz")) return "weddingz";
  if (t.includes("venuelook")) return "venuelook";
  if (t.includes("whatsapp")) return "whatsapp";
  if (t.includes("referral") || t.includes("referred")) return "referral";
  return "other";
}

function detectEventType(text: string): string {
  const t = text.toLowerCase();
  for (const [kw, type] of EVENT_KEYWORDS) {
    if (t.includes(kw)) return type;
  }
  return "wedding";
}

/** Pull "Label: value" from a labelled line, trying each alias in order. */
function field(lines: string[], labels: string[]): string {
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    if (labels.some((l) => key === l || key.includes(l))) {
      return line.slice(idx + 1).trim();
    }
  }
  return "";
}

/** Normalize "12 Dec 2026" / "12/12/2026" to yyyy-mm-dd when possible. */
function normalizeDate(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // "12 Dec 2026" or "12 December 2026"
  const m1 = s.match(/(\d{1,2})\s+([A-Za-z]+)\.?\s+(\d{4})/);
  if (m1) {
    const mon = MONTHS[m1[2].slice(0, 3).toLowerCase()];
    if (mon) {
      return `${m1[3]}-${String(mon).padStart(2, "0")}-${m1[1].padStart(2, "0")}`;
    }
  }
  // "12/12/2026" or "12-12-2026" (assume d/m/y, India convention)
  const m2 = s.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (m2) {
    return `${m2[3]}-${m2[2].padStart(2, "0")}-${m2[1].padStart(2, "0")}`;
  }
  return s; // leave the raw text for the owner to fix in the preview
}

function firstEmail(text: string): string {
  return text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] ?? "";
}

function firstPhone(text: string): string {
  const m = text.match(/(\+?\d[\d\s-]{7,}\d)/);
  return m ? m[1].trim() : "";
}

function digitsOnly(s: string): string {
  const n = s.replace(/[^0-9]/g, "");
  return n || "";
}

/**
 * Deterministic line/regex parser used when no Anthropic key is set. Handles the
 * common "Label: value" marketplace format plus loose free-text fallbacks, so
 * the feature is fully usable with no API key.
 */
function templatedParse(raw: string): ParsedEnquiry {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const coupleName = field(lines, ["name", "couple", "contact", "client"]);
  const email = field(lines, ["email", "e-mail"]) || firstEmail(raw);
  const phoneField = field(lines, ["phone", "mobile", "contact no", "number"]);
  const phone = phoneField || firstPhone(raw);
  const eventField = field(lines, ["event", "function", "occasion", "type"]);
  const eventType = detectEventType(eventField || raw);
  const date = normalizeDate(field(lines, ["date", "event date", "when"]));
  const guestCount = digitsOnly(
    field(lines, ["guests", "guest count", "pax", "capacity", "no. of guests"]),
  );
  const city = field(lines, ["city", "location", "place", "venue location"]);

  return {
    coupleName,
    phone,
    email,
    eventType,
    date,
    guestCount,
    city,
    source: detectSource(raw),
  };
}

function sanitize(parsed: ParsedEnquiry): ParsedEnquiry {
  const source = VALID_SOURCES.has(parsed.source) ? parsed.source : "other";
  const eventType = VALID_EVENT_TYPES.has(parsed.eventType)
    ? parsed.eventType
    : "wedding";
  return {
    coupleName: (parsed.coupleName ?? "").trim().slice(0, 200),
    phone: (parsed.phone ?? "").trim().slice(0, 40),
    email: (parsed.email ?? "").trim().slice(0, 200),
    eventType,
    date: normalizeDate((parsed.date ?? "").trim()),
    guestCount: digitsOnly(String(parsed.guestCount ?? "")),
    city: (parsed.city ?? "").trim().slice(0, 120),
    source,
  };
}

/**
 * Parse a raw pasted marketplace enquiry into a structured, editable lead.
 * Uses Claude forced tool-use when configured, else a deterministic templated
 * parser. Read-only — nothing is persisted here; the owner reviews then imports.
 */
export async function parseEnquiry(raw: string): Promise<ParseEnquiryResult> {
  const text = (raw ?? "").trim();
  if (text.length < 8) {
    return { ok: false, message: "Paste an enquiry to parse." };
  }
  if (text.length > 20000) {
    return {
      ok: false,
      message: "That enquiry is too long — paste just the lead details.",
    };
  }

  if (anthropicConfigured) {
    try {
      const parsed = await generateObject<ParsedEnquiry>({
        prompt:
          `Extract the lead details from this raw marketplace enquiry:\n\n"""\n${text}\n"""`,
        system: SYSTEM,
        schema: ENQUIRY_SCHEMA as unknown as Record<string, unknown>,
        toolName: "extract_enquiry",
        toolDescription:
          "Return the structured lead fields extracted from a raw enquiry.",
        tier: "haiku",
        maxTokens: 600,
      });
      if (parsed && (parsed.coupleName || parsed.phone || parsed.email)) {
        return { ok: true, parsed: sanitize(parsed), source: "ai" };
      }
    } catch {
      // fall through to the deterministic parser
    }
  }

  return { ok: true, parsed: sanitize(templatedParse(text)), source: "template" };
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/**
 * Resolve the org's primary venue id. Leads require a venueId (notNull); we scope
 * strictly to the active org and never trust a client-supplied id.
 */
async function resolveVenueId(orgId: string): Promise<string | null> {
  const [venue] = await getDb()
    .select({ id: schema.venues.id })
    .from(schema.venues)
    .where(eq(schema.venues.organizationId, orgId))
    .limit(1);
  return venue?.id ?? null;
}

/**
 * Import a parsed enquiry as a lead in the org's pipeline. Scopes the write to
 * the active org, dedupes by phone within the org, and tags the detected source.
 */
export async function createImportedLead(
  parsed: ParsedEnquiry,
): Promise<ImportLeadResult> {
  const org = await getActiveOrg();
  if (!org) {
    return {
      ok: false,
      reason: "no_db",
      message: "Connect a database to save changes.",
    };
  }

  const clean = sanitize(parsed);
  const coupleName = clean.coupleName;
  const phone = clean.phone;

  if (!coupleName) {
    return { ok: false, message: "Add the couple or contact name first." };
  }
  if (!phone) {
    return { ok: false, message: "A phone number is needed to import this lead." };
  }

  try {
    const venueId = await resolveVenueId(org.id);
    if (!venueId) {
      return {
        ok: false,
        reason: "no_venue",
        message: "Add a venue first, then import enquiries against it.",
      };
    }

    // Dedupe by phone within the org so re-imports don't pile up duplicates.
    const [existing] = await getDb()
      .select({ id: schema.leads.id })
      .from(schema.leads)
      .where(
        and(
          eq(schema.leads.organizationId, org.id),
          eq(schema.leads.phone, phone),
        ),
      )
      .limit(1);

    if (existing) {
      return {
        ok: false,
        reason: "duplicate",
        message: `${coupleName} is already in your pipeline (same phone).`,
      };
    }

    const guests = clean.guestCount ? Number(clean.guestCount) : null;
    const dateRequested = /^\d{4}-\d{2}-\d{2}$/.test(clean.date)
      ? clean.date
      : null;

    const [lead] = await getDb()
      .insert(schema.leads)
      .values({
        organizationId: org.id,
        venueId,
        coupleName,
        phone,
        email: clean.email || null,
        source: (VALID_SOURCES.has(clean.source) ? clean.source : "other") as never,
        eventType: (VALID_EVENT_TYPES.has(clean.eventType)
          ? clean.eventType
          : "wedding") as never,
        dateRequested,
        guestCount: guests && guests > 0 ? guests : null,
        stage: "new",
      })
      .returning({ id: schema.leads.id });

    await logActivity({
      organizationId: org.id,
      venueId,
      type: "lead.imported",
      payload: { leadId: lead.id, source: clean.source },
    });

    revalidatePath(ROUTE);
    revalidatePath("/dashboard/leads");
    return { ok: true, message: `${coupleName} imported into your pipeline.` };
  } catch {
    return { ok: false, message: "Couldn't import that enquiry. Please try again." };
  }
}
