"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { logActivity } from "@/lib/activity";
import { getDb, schema } from "@/lib/db";
import { createDepositLink } from "@/lib/payments";
import { getActiveOrg } from "@/lib/org";

const ROUTE = "/dashboard/proposals";

export type ActionResult =
  | { ok: true; message: string; url?: string; demo?: boolean }
  | { ok: false; message: string };

function toNum(v: FormDataEntryValue | null): number {
  const n = typeof v === "string" ? Number(v.replace(/[^0-9.]/g, "")) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Place a 7-day provisional hold on the requested date. Writes a provisional
 * booking + calendar block when an org is connected; demo mode confirms the
 * intent without persisting.
 */
export async function placeHoldAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const couple = str(formData.get("couple")) || "this couple";
  const eventDate = str(formData.get("eventDate"));
  const leadId = str(formData.get("leadId")) || undefined;

  const org = await getActiveOrg();
  if (!org) {
    return {
      ok: true,
      message: `Provisional hold prepared for ${couple}. Connect a database to lock the date for real.`,
      demo: true,
    };
  }

  if (!eventDate) {
    return { ok: false, message: "Pick an event date before placing a hold." };
  }

  try {
    const db = getDb();
    const [venue] = await db
      .select({ id: schema.venues.id })
      .from(schema.venues)
      .where(eq(schema.venues.organizationId, org.id))
      .limit(1);

    if (!venue) {
      return {
        ok: false,
        message: "Add a venue in Settings before placing holds.",
      };
    }

    const holdExpiresAt = new Date();
    holdExpiresAt.setDate(holdExpiresAt.getDate() + 7);

    const [booking] = await db
      .insert(schema.bookings)
      .values({
        organizationId: org.id,
        venueId: venue.id,
        leadId: leadId ?? null,
        status: "provisional",
        eventDate,
        holdExpiresAt,
      })
      .returning({ id: schema.bookings.id });

    if (leadId) {
      await db
        .update(schema.leads)
        .set({ stage: "hold" })
        .where(
          and(
            eq(schema.leads.id, leadId),
            eq(schema.leads.organizationId, org.id),
          ),
        );
    }

    await logActivity({
      organizationId: org.id,
      venueId: venue.id,
      type: "proposal.hold_placed",
      payload: { bookingId: booking.id, eventDate, couple },
    });

    revalidatePath(ROUTE);
    return {
      ok: true,
      message: `7-day provisional hold placed for ${couple} on ${eventDate}.`,
    };
  } catch {
    return {
      ok: false,
      message: "Could not place the hold just now. Please try again.",
    };
  }
}

/**
 * Generate a Razorpay deposit payment link for a proposal and (when live)
 * record a pending payment against the latest booking.
 */
export async function sendDepositLinkAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const couple = str(formData.get("couple")) || "this couple";
  const contact = str(formData.get("contact"));
  const total = toNum(formData.get("total"));
  const depositPct = toNum(formData.get("depositPct")) || 20;
  const leadId = str(formData.get("leadId")) || undefined;

  const depositRupees = Math.round((total * depositPct) / 100);
  if (depositRupees <= 0) {
    return {
      ok: false,
      message: "Add line items so there's a deposit amount to collect.",
    };
  }

  const description = `Booking deposit (${depositPct}%) for ${couple}`;

  let link: Awaited<ReturnType<typeof createDepositLink>>;
  try {
    link = await createDepositLink({
      amountPaise: depositRupees * 100,
      name: couple,
      contact,
      description,
      referenceId: leadId,
    });
  } catch {
    return {
      ok: false,
      message: "Razorpay couldn't create the link. Check your keys and retry.",
    };
  }

  const org = await getActiveOrg();

  if (!org) {
    return {
      ok: true,
      demo: link.demo,
      url: link.url,
      message: link.demo
        ? `Deposit link drafted for ${couple} — goes live once Razorpay keys are added.`
        : `Deposit link ready for ${couple}.`,
    };
  }

  try {
    const db = getDb();
    if (!link.demo) {
      const [booking] = await db
        .select({ id: schema.bookings.id })
        .from(schema.bookings)
        .where(eq(schema.bookings.organizationId, org.id))
        .orderBy(schema.bookings.createdAt)
        .limit(1);

      if (booking) {
        await db.insert(schema.payments).values({
          organizationId: org.id,
          bookingId: booking.id,
          type: "deposit",
          amount: String(depositRupees),
          status: "pending",
          razorpayPaymentLinkId: link.id ?? null,
        });
      }
    }

    if (leadId) {
      await db
        .update(schema.leads)
        .set({ stage: "deposit" })
        .where(
          and(
            eq(schema.leads.id, leadId),
            eq(schema.leads.organizationId, org.id),
          ),
        );
    }

    await logActivity({
      organizationId: org.id,
      type: "proposal.deposit_link_sent",
      payload: { couple, depositRupees, demo: link.demo },
    });

    revalidatePath(ROUTE);
  } catch {
    // Link was created; persistence is best-effort. Still surface the URL.
  }

  return {
    ok: true,
    demo: link.demo,
    url: link.url,
    message: link.demo
      ? `Deposit link drafted for ${couple} — goes live once Razorpay keys are added.`
      : `Deposit link ready for ${couple}.`,
  };
}
