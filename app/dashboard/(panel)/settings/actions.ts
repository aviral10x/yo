"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { logActivity } from "@/lib/activity";
import { VENUE_TYPE_LABELS } from "@/lib/constants";
import { getDb, schema } from "@/lib/db";
import { getActiveOrg } from "@/lib/org";

export type VenueState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

type VenueType = typeof schema.venueTypeEnum.enumValues[number];

function str(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : undefined;
}

/**
 * Persist the venue details form. Demo-safe: with no active org we return a
 * friendly message instead of writing. Never trusts a client-supplied org id.
 */
export async function saveVenue(
  _prev: VenueState,
  formData: FormData,
): Promise<VenueState> {
  const name = str(formData.get("name"));
  if (!name) {
    return { status: "error", message: "Please enter your venue name." };
  }

  const rawType = str(formData.get("type"));
  const type = (rawType && rawType in VENUE_TYPE_LABELS
    ? rawType
    : "lawn") as VenueType;
  const city = str(formData.get("city")) ?? null;
  const state = str(formData.get("state")) ?? null;

  const org = await getActiveOrg();
  if (!org) {
    return { status: "error", message: "Connect a database to save changes." };
  }

  try {
    const db = getDb();
    const [existing] = await db
      .select({ id: schema.venues.id })
      .from(schema.venues)
      .where(eq(schema.venues.organizationId, org.id))
      .limit(1);

    if (existing) {
      await db
        .update(schema.venues)
        .set({ name, type, city, state })
        .where(
          and(
            eq(schema.venues.id, existing.id),
            eq(schema.venues.organizationId, org.id),
          ),
        );
    } else {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48) || "venue";
      await db.insert(schema.venues).values({
        organizationId: org.id,
        name,
        slug,
        type,
        city,
        state,
      });
    }

    await logActivity({
      organizationId: org.id,
      type: "venue.updated",
      payload: { name, type },
    });
    revalidatePath("/dashboard/settings");
    return { status: "success", message: "Venue details saved." };
  } catch {
    return {
      status: "error",
      message: "We couldn't save your changes. Please try again.",
    };
  }
}
