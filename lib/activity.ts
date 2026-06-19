import "server-only";

import { getDb, schema } from "@/lib/db";
import { isDbConfigured } from "@/lib/org";

/**
 * Append a row to the activity stream that powers the PMF metrics
 * (IMPLEMENTATION_PLAN §17). Best-effort and non-throwing — never let analytics
 * break a user action.
 */
export async function logActivity(input: {
  organizationId?: string;
  venueId?: string;
  type: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    await getDb().insert(schema.activityEvents).values({
      organizationId: input.organizationId,
      venueId: input.venueId,
      type: input.type,
      payload: input.payload ?? {},
    });
  } catch {
    // swallow — analytics must not affect the request
  }
}
