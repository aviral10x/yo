"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { getActiveOrg } from "@/lib/org";
import { getDb, schema } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { LEAD_STAGES } from "@/lib/constants";

const ROUTE = "/dashboard/leads";

const VALID_STAGES = new Set<string>(LEAD_STAGES.map((s) => s.value));
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

export type ActionState = {
  ok: boolean;
  message: string;
};

function str(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : undefined;
}

function num(v: FormDataEntryValue | null): number | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return undefined;
  const n = Number(s.replace(/[^0-9]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * Resolve the org's primary venue id. Leads require a venueId (notNull); we
 * scope strictly to the active org and never trust a client-supplied id.
 */
async function resolveVenueId(orgId: string): Promise<string | null> {
  const [venue] = await getDb()
    .select({ id: schema.venues.id })
    .from(schema.venues)
    .where(eq(schema.venues.organizationId, orgId))
    .limit(1);
  return venue?.id ?? null;
}

/** Create a new lead from the "New lead" dialog form. */
export async function createLead(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const org = await getActiveOrg();
  if (!org) {
    return { ok: false, message: "Connect a database to save changes." };
  }

  const coupleName = str(formData.get("coupleName"));
  if (!coupleName) {
    return { ok: false, message: "Add the couple or contact name." };
  }
  const phone = str(formData.get("phone"));
  if (!phone) {
    return { ok: false, message: "A phone number helps you follow up fast." };
  }

  const source = str(formData.get("source")) ?? "direct";
  const eventType = str(formData.get("eventType")) ?? "wedding";
  const dateRequested = str(formData.get("dateRequested"));
  const stage = str(formData.get("stage")) ?? "new";

  try {
    const venueId = await resolveVenueId(org.id);
    if (!venueId) {
      return {
        ok: false,
        message: "Add a venue first, then capture enquiries against it.",
      };
    }

    const [lead] = await getDb()
      .insert(schema.leads)
      .values({
        organizationId: org.id,
        venueId,
        coupleName,
        phone,
        email: str(formData.get("email")),
        source: VALID_SOURCES.has(source) ? (source as never) : "direct",
        eventType: VALID_EVENT_TYPES.has(eventType)
          ? (eventType as never)
          : "wedding",
        dateRequested: dateRequested ?? null,
        guestCount: num(formData.get("guestCount")) ?? null,
        stage: VALID_STAGES.has(stage) ? (stage as never) : "new",
      })
      .returning({ id: schema.leads.id });

    await logActivity({
      organizationId: org.id,
      venueId,
      type: "lead.created",
      payload: { leadId: lead.id, source, stage },
    });

    revalidatePath(ROUTE);
    return { ok: true, message: `Enquiry from ${coupleName} captured.` };
  } catch {
    return {
      ok: false,
      message: "Couldn't save that enquiry. Please try again.",
    };
  }
}

/** Move a lead to a new pipeline stage from the detail sheet. */
export async function updateLeadStage(
  leadId: string,
  nextStage: string,
): Promise<ActionState> {
  const org = await getActiveOrg();
  if (!org) {
    return { ok: false, message: "Connect a database to save changes." };
  }
  if (!VALID_STAGES.has(nextStage)) {
    return { ok: false, message: "Unknown pipeline stage." };
  }

  try {
    const [updated] = await getDb()
      .update(schema.leads)
      .set({ stage: nextStage as never })
      // Scope to the active org so a lead from another tenant can't be moved.
      .where(
        and(
          eq(schema.leads.id, leadId),
          eq(schema.leads.organizationId, org.id),
        ),
      )
      .returning({ id: schema.leads.id, venueId: schema.leads.venueId });

    if (!updated) {
      return { ok: false, message: "That enquiry no longer exists." };
    }

    await logActivity({
      organizationId: org.id,
      venueId: updated.venueId,
      type: "lead.stage_changed",
      payload: { leadId, stage: nextStage },
    });

    revalidatePath(ROUTE);
    return { ok: true, message: "Pipeline stage updated." };
  } catch {
    return { ok: false, message: "Couldn't update the stage. Try again." };
  }
}
