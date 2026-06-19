"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { logActivity } from "@/lib/activity";
import { draftText, anthropicConfigured } from "@/lib/ai/claude";
import { getDb, schema } from "@/lib/db";
import { getActiveOrg } from "@/lib/org";
import type { ChecklistItem, TimelineItem } from "@/components/operations/types";

export type ActionResult = { ok: boolean; message: string };

const ROUTE = "/dashboard/events";

/** Persist the full checklist for one event (scoped to the active org). */
export async function saveChecklist(
  eventId: string,
  checklist: ChecklistItem[],
): Promise<ActionResult> {
  const org = await getActiveOrg();
  if (!org) return { ok: false, message: "Connect a database to save changes." };

  try {
    await getDb()
      .update(schema.events)
      .set({ checklist })
      .where(
        and(
          eq(schema.events.id, eventId),
          eq(schema.events.organizationId, org.id),
        ),
      );
    await logActivity({
      organizationId: org.id,
      type: "event.checklist_updated",
      payload: {
        eventId,
        done: checklist.filter((c) => c.done).length,
        total: checklist.length,
      },
    });
    revalidatePath(ROUTE);
    return { ok: true, message: "Checklist saved." };
  } catch {
    return { ok: false, message: "Could not save the checklist. Try again." };
  }
}

/** Persist menu + décor notes for one event. */
export async function saveNotes(
  eventId: string,
  menuNotes: string,
  decorNotes: string,
): Promise<ActionResult> {
  const org = await getActiveOrg();
  if (!org) return { ok: false, message: "Connect a database to save changes." };

  try {
    await getDb()
      .update(schema.events)
      .set({ menu: { notes: menuNotes }, decorNotes })
      .where(
        and(
          eq(schema.events.id, eventId),
          eq(schema.events.organizationId, org.id),
        ),
      );
    await logActivity({
      organizationId: org.id,
      type: "event.notes_updated",
      payload: { eventId },
    });
    revalidatePath(ROUTE);
    return { ok: true, message: "Notes saved." };
  } catch {
    return { ok: false, message: "Could not save notes. Try again." };
  }
}

/**
 * Generate a printable day-sheet brief. When Claude is configured we draft a
 * crisp operations brief from the event's checklist/timeline/notes; otherwise
 * we assemble a clean fallback so the feature works with zero setup.
 */
export async function generateDaySheet(input: {
  eventId: string;
  coupleName: string;
  eventDate: string;
  spaceName: string | null;
  guestCount: number | null;
  checklist: ChecklistItem[];
  timeline: TimelineItem[];
  menuNotes: string;
  decorNotes: string;
}): Promise<ActionResult & { daySheet?: string }> {
  const org = await getActiveOrg();

  const fallback = buildFallbackSheet(input);
  let daySheet = fallback;
  let usedAi = false;

  if (anthropicConfigured) {
    try {
      daySheet = await draftText({
        tier: "haiku",
        system:
          "You are an Indian wedding venue operations manager. Write a concise, print-ready day sheet for the on-ground team. Use clear section headings (Event, Timeline, Setup checklist, Menu, Décor, Reminders) and short bullet lines. No preamble, no markdown bold — plain text the captain can read at a glance.",
        prompt:
          `Build the day sheet for this event.\n\n` +
          `Couple: ${input.coupleName}\n` +
          `Date: ${input.eventDate}\n` +
          `Space: ${input.spaceName ?? "—"}\n` +
          `Guests: ${input.guestCount ?? "—"}\n\n` +
          `Ceremony timeline:\n${
            input.timeline.map((t) => `- ${t.time} ${t.item}`).join("\n") || "- (none yet)"
          }\n\n` +
          `Setup checklist:\n${
            input.checklist
              .map((c) => `- [${c.done ? "x" : " "}] ${c.label}`)
              .join("\n") || "- (none yet)"
          }\n\n` +
          `Menu notes: ${input.menuNotes || "—"}\n` +
          `Décor notes: ${input.decorNotes || "—"}`,
        maxTokens: 900,
      });
      usedAi = true;
    } catch {
      daySheet = fallback;
    }
  }

  await logActivity({
    organizationId: org?.id,
    type: "event.day_sheet_generated",
    payload: { eventId: input.eventId, usedAi },
  });

  return {
    ok: true,
    message: usedAi ? "Day sheet drafted with AI." : "Day sheet ready.",
    daySheet,
  };
}

function buildFallbackSheet(input: {
  coupleName: string;
  eventDate: string;
  spaceName: string | null;
  guestCount: number | null;
  checklist: ChecklistItem[];
  timeline: TimelineItem[];
  menuNotes: string;
  decorNotes: string;
}): string {
  const lines: string[] = [];
  lines.push(`DAY SHEET — ${input.coupleName}`);
  lines.push(
    `${input.eventDate}${input.spaceName ? ` · ${input.spaceName}` : ""}${
      input.guestCount ? ` · ${input.guestCount} guests` : ""
    }`,
  );
  lines.push("");
  lines.push("CEREMONY TIMELINE");
  if (input.timeline.length) {
    for (const t of input.timeline) lines.push(`  ${t.time}  ${t.item}`);
  } else {
    lines.push("  (no timeline entries yet)");
  }
  lines.push("");
  lines.push("SETUP CHECKLIST");
  if (input.checklist.length) {
    for (const c of input.checklist) lines.push(`  [${c.done ? "x" : " "}] ${c.label}`);
  } else {
    lines.push("  (no checklist items yet)");
  }
  lines.push("");
  lines.push("MENU NOTES");
  lines.push(`  ${input.menuNotes || "—"}`);
  lines.push("");
  lines.push("DÉCOR NOTES");
  lines.push(`  ${input.decorNotes || "—"}`);
  return lines.join("\n");
}
