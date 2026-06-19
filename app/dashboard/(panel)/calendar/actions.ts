"use server";

import { findAvailability, type AvailabilityResult } from "@/lib/availability";
import { logActivity } from "@/lib/activity";
import { getActiveOrg } from "@/lib/org";

export type AvailabilityState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; result: AvailabilityResult };

/**
 * Run an availability check for the active org (or demo data). This is a read,
 * so it works without a DB; we only log activity when there is a live org.
 */
export async function checkAvailabilityAction(
  _prev: AvailabilityState,
  formData: FormData,
): Promise<AvailabilityState> {
  const date = String(formData.get("date") ?? "").trim();
  const guestCount = Number(formData.get("guestCount") ?? 0);
  const eventType = String(formData.get("eventType") ?? "wedding").trim();

  if (!date) {
    return { status: "error", message: "Pick an event date to check." };
  }
  if (!Number.isFinite(guestCount) || guestCount <= 0) {
    return { status: "error", message: "Enter the expected guest count." };
  }

  try {
    const result = await findAvailability({ date, guestCount, eventType });

    // Best-effort analytics — never trust a client-supplied org id.
    const org = await getActiveOrg();
    if (org) {
      await logActivity({
        organizationId: org.id,
        type: "availability.checked",
        payload: {
          date,
          guestCount,
          eventType,
          free: result.freeSpaces.length,
          nextStep: result.nextStep.kind,
        },
      });
    }

    return { status: "success", result };
  } catch {
    return {
      status: "error",
      message: "Could not check availability. Please try again.",
    };
  }
}
