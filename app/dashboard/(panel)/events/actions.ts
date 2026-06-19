"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { logActivity } from "@/lib/activity";
import { draftText, anthropicConfigured } from "@/lib/ai/claude";
import { getDb, schema } from "@/lib/db";
import { getActiveOrg } from "@/lib/org";
import type {
  ChecklistItem,
  MenuCourse,
  RoomingRow,
  TimelineItem,
  VendorAssignment,
} from "@/components/operations/types";

export type ActionResult = { ok: boolean; message: string };

const ROUTE = "/dashboard/events";

/** Read the current `menu` jsonb so partial updates don't clobber siblings. */
async function readMenuBlob(
  orgId: string,
  eventId: string,
): Promise<Record<string, unknown>> {
  const rows = await getDb()
    .select({ menu: schema.events.menu })
    .from(schema.events)
    .where(
      and(eq(schema.events.id, eventId), eq(schema.events.organizationId, orgId)),
    )
    .limit(1);
  return (rows[0]?.menu as Record<string, unknown> | null) ?? {};
}

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

/** Persist the editable ceremony timeline (ordered rows of time + item). */
export async function saveTimeline(
  eventId: string,
  timeline: TimelineItem[],
): Promise<ActionResult> {
  const org = await getActiveOrg();
  if (!org) return { ok: false, message: "Connect a database to save changes." };

  const clean = timeline
    .map((t) => ({ time: t.time.trim(), item: t.item.trim() }))
    .filter((t) => t.time || t.item);

  try {
    await getDb()
      .update(schema.events)
      .set({ timeline: clean })
      .where(
        and(
          eq(schema.events.id, eventId),
          eq(schema.events.organizationId, org.id),
        ),
      );
    await logActivity({
      organizationId: org.id,
      type: "event.timeline_updated",
      payload: { eventId, rows: clean.length },
    });
    revalidatePath(ROUTE);
    return { ok: true, message: "Timeline saved." };
  } catch {
    return { ok: false, message: "Could not save the timeline. Try again." };
  }
}

/** Persist the menu selections (courses) + free-text notes. */
export async function saveMenu(
  eventId: string,
  menuCourses: MenuCourse[],
  menuNotes: string,
): Promise<ActionResult> {
  const org = await getActiveOrg();
  if (!org) return { ok: false, message: "Connect a database to save changes." };

  try {
    const blob = await readMenuBlob(org.id, eventId);
    await getDb()
      .update(schema.events)
      .set({ menu: { ...blob, courses: menuCourses, notes: menuNotes } })
      .where(
        and(
          eq(schema.events.id, eventId),
          eq(schema.events.organizationId, org.id),
        ),
      );
    const selected = menuCourses.reduce(
      (n, c) => n + c.items.filter((i) => i.selected).length,
      0,
    );
    await logActivity({
      organizationId: org.id,
      type: "event.menu_updated",
      payload: { eventId, selected },
    });
    revalidatePath(ROUTE);
    return { ok: true, message: "Menu saved." };
  } catch {
    return { ok: false, message: "Could not save the menu. Try again." };
  }
}

/** Persist décor notes. */
export async function saveDecorNotes(
  eventId: string,
  decorNotes: string,
): Promise<ActionResult> {
  const org = await getActiveOrg();
  if (!org) return { ok: false, message: "Connect a database to save changes." };

  try {
    await getDb()
      .update(schema.events)
      .set({ decorNotes })
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

/** Persist the rooming list (stored in the `roomingList` jsonb). */
export async function saveRooming(
  eventId: string,
  rows: RoomingRow[],
): Promise<ActionResult> {
  const org = await getActiveOrg();
  if (!org) return { ok: false, message: "Connect a database to save changes." };

  const clean = rows
    .map((r) => ({
      guest: r.guest.trim(),
      roomType: r.roomType.trim(),
      nights: Number.isFinite(r.nights) ? Math.max(0, Math.round(r.nights)) : 0,
      checkIn: r.checkIn,
    }))
    .filter((r) => r.guest || r.roomType);

  try {
    await getDb()
      .update(schema.events)
      .set({ roomingList: { rows: clean } })
      .where(
        and(
          eq(schema.events.id, eventId),
          eq(schema.events.organizationId, org.id),
        ),
      );
    await logActivity({
      organizationId: org.id,
      type: "event.rooming_updated",
      payload: { eventId, rooms: clean.reduce((n, r) => n + r.nights, 0) },
    });
    revalidatePath(ROUTE);
    return { ok: true, message: "Rooming list saved." };
  } catch {
    return { ok: false, message: "Could not save the rooming list. Try again." };
  }
}

/** Persist the vendor assignments (stored alongside the menu blob). */
export async function saveVendors(
  eventId: string,
  vendors: VendorAssignment[],
): Promise<ActionResult> {
  const org = await getActiveOrg();
  if (!org) return { ok: false, message: "Connect a database to save changes." };

  try {
    const blob = await readMenuBlob(org.id, eventId);
    await getDb()
      .update(schema.events)
      .set({ menu: { ...blob, vendors } })
      .where(
        and(
          eq(schema.events.id, eventId),
          eq(schema.events.organizationId, org.id),
        ),
      );
    await logActivity({
      organizationId: org.id,
      type: "event.vendors_updated",
      payload: { eventId, count: vendors.length },
    });
    revalidatePath(ROUTE);
    return { ok: true, message: "Vendors saved." };
  } catch {
    return { ok: false, message: "Could not save vendors. Try again." };
  }
}

/**
 * Generate a printable day-sheet brief. When Claude is configured we draft a
 * crisp operations brief from the event's checklist/timeline/menu/notes;
 * otherwise we assemble a clean fallback so the feature works with zero setup.
 */
export async function generateDaySheet(input: {
  eventId: string;
  coupleName: string;
  eventDate: string;
  spaceName: string | null;
  guestCount: number | null;
  checklist: ChecklistItem[];
  timeline: TimelineItem[];
  menuCourses: MenuCourse[];
  vendors: VendorAssignment[];
  rooming: RoomingRow[];
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
          "You are an Indian wedding venue operations manager. Write a concise, print-ready day sheet for the on-ground team. Use clear section headings (Event, Timeline, Setup checklist, Menu, Vendors, Rooming, Décor, Reminders) and short bullet lines. No preamble, no markdown bold — plain text the captain can read at a glance.",
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
          `Menu (selected dishes by course):\n${
            menuToLines(input.menuCourses) || "- (none yet)"
          }\n\n` +
          `Vendors:\n${
            input.vendors.map((v) => `- ${v.name} (${v.role || v.category})`).join("\n") ||
            "- (none yet)"
          }\n\n` +
          `Rooming list:\n${
            input.rooming
              .map((r) => `- ${r.guest}: ${r.roomType} × ${r.nights} night(s)`)
              .join("\n") || "- (none)"
          }\n\n` +
          `Menu notes: ${input.menuNotes || "—"}\n` +
          `Décor notes: ${input.decorNotes || "—"}`,
        maxTokens: 1100,
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

function menuToLines(courses: MenuCourse[]): string {
  const lines: string[] = [];
  for (const c of courses) {
    const picked = c.items.filter((i) => i.selected).map((i) => i.label);
    if (picked.length) lines.push(`- ${c.course}: ${picked.join(", ")}`);
  }
  return lines.join("\n");
}

function buildFallbackSheet(input: {
  coupleName: string;
  eventDate: string;
  spaceName: string | null;
  guestCount: number | null;
  checklist: ChecklistItem[];
  timeline: TimelineItem[];
  menuCourses: MenuCourse[];
  vendors: VendorAssignment[];
  rooming: RoomingRow[];
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
  lines.push("MENU");
  const menuLines = menuToLines(input.menuCourses).replace(/^- /gm, "  ");
  lines.push(menuLines || "  (no dishes selected yet)");
  lines.push("");
  lines.push("VENDORS");
  if (input.vendors.length) {
    for (const v of input.vendors) lines.push(`  ${v.name} — ${v.role || v.category}`);
  } else {
    lines.push("  (none assigned)");
  }
  lines.push("");
  lines.push("ROOMING LIST");
  if (input.rooming.length) {
    for (const r of input.rooming)
      lines.push(`  ${r.guest}: ${r.roomType} × ${r.nights} night(s)`);
  } else {
    lines.push("  (none)");
  }
  lines.push("");
  lines.push("MENU NOTES");
  lines.push(`  ${input.menuNotes || "—"}`);
  lines.push("");
  lines.push("DÉCOR NOTES");
  lines.push(`  ${input.decorNotes || "—"}`);
  return lines.join("\n");
}
