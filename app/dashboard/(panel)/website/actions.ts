"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { logActivity } from "@/lib/activity";
import { getDb, schema } from "@/lib/db";
import { getActiveOrg } from "@/lib/org";

export type WebsiteState = {
  ok: boolean;
  message: string;
};

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Normalise a comma / newline separated amenities string into a clean list. */
function parseAmenities(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);
}

/**
 * Persist the venue's website content + chosen template. Scoped to the active
 * org's venue and its websiteConfigs row; demo-safe (no DB) returns a friendly
 * message so the form still feels alive in the showcase.
 */
export async function saveWebsite(
  _prev: WebsiteState,
  formData: FormData,
): Promise<WebsiteState> {
  const templateId = str(formData.get("templateId")) || "classic";
  const story = str(formData.get("story"));
  const amenities = parseAmenities(str(formData.get("amenities")));
  const packageNote = str(formData.get("packageNote"));

  const org = await getActiveOrg();
  if (!org) {
    return {
      ok: false,
      message: "Connect a database to save changes. Showing demo data for now.",
    };
  }

  try {
    const db = getDb();

    // Resolve the org's venue (first one — single-venue on Starter/Growth).
    const [venue] = await db
      .select({ id: schema.venues.id })
      .from(schema.venues)
      .where(eq(schema.venues.organizationId, org.id))
      .limit(1);

    if (!venue) {
      return {
        ok: false,
        message: "Add your venue in Settings before publishing a website.",
      };
    }

    // Venue-level content: story + amenities live on the venue row.
    await db
      .update(schema.venues)
      .set({ story: story || null, amenities })
      .where(
        and(
          eq(schema.venues.id, venue.id),
          eq(schema.venues.organizationId, org.id),
        ),
      );

    // Website config: template + the package-ranges note (kept in blocks).
    await db
      .insert(schema.websiteConfigs)
      .values({
        organizationId: org.id,
        venueId: venue.id,
        templateId,
        blocks: { packageNote },
      })
      .onConflictDoUpdate({
        target: schema.websiteConfigs.venueId,
        set: { templateId, blocks: { packageNote } },
      });

    await logActivity({
      organizationId: org.id,
      venueId: venue.id,
      type: "website.saved",
      payload: { templateId, amenities: amenities.length },
    });

    revalidatePath("/dashboard/website");
    return { ok: true, message: "Website content saved." };
  } catch {
    return {
      ok: false,
      message: "We couldn't save that just now. Please try again.",
    };
  }
}

/**
 * Flip the venue between published and draft. Sets status + the website config's
 * publishedAt timestamp so the public render knows the site is live.
 */
export async function setPublishState(
  publish: boolean,
): Promise<WebsiteState> {
  const org = await getActiveOrg();
  if (!org) {
    return {
      ok: false,
      message: "Connect a database to publish your site.",
    };
  }

  try {
    const db = getDb();
    const [venue] = await db
      .select({ id: schema.venues.id })
      .from(schema.venues)
      .where(eq(schema.venues.organizationId, org.id))
      .limit(1);

    if (!venue) {
      return { ok: false, message: "Add your venue in Settings first." };
    }

    await db
      .update(schema.venues)
      .set({ status: publish ? "published" : "draft" })
      .where(
        and(
          eq(schema.venues.id, venue.id),
          eq(schema.venues.organizationId, org.id),
        ),
      );

    await db
      .insert(schema.websiteConfigs)
      .values({
        organizationId: org.id,
        venueId: venue.id,
        publishedAt: publish ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: schema.websiteConfigs.venueId,
        set: { publishedAt: publish ? new Date() : null },
      });

    await logActivity({
      organizationId: org.id,
      venueId: venue.id,
      type: publish ? "website.published" : "website.unpublished",
    });

    revalidatePath("/dashboard/website");
    return {
      ok: true,
      message: publish ? "Your website is live." : "Website moved to draft.",
    };
  } catch {
    return { ok: false, message: "We couldn't update that just now." };
  }
}
