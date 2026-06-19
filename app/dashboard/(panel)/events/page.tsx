import { CalendarCheck2, CheckCircle2, ListChecks, PartyPopper } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Stat } from "@/components/dashboard/stat";
import { EventsBoard } from "@/components/operations/events-board";
import { STANDARD_MENU_COURSES } from "@/components/operations/constants";
import type {
  ChecklistItem,
  EventDetail,
  MenuCourse,
  RoomingRow,
  TimelineItem,
  VendorAssignment,
  VendorOption,
} from "@/components/operations/types";
import { getDb, schema } from "@/lib/db";
import { DEMO_EVENTS, DEMO_VENDORS } from "@/lib/demo-data";
import { getActiveOrg } from "@/lib/org";
import { and, desc, eq } from "drizzle-orm";

/** The standard run-of-show every wedding event is prepped against. */
const STANDARD_CHECKLIST: string[] = [
  "Confirm final guest count",
  "Lock ceremony timeline with family",
  "Brief catering captain on menu",
  "Stage & mandap décor sign-off",
  "Sound & lighting check",
  "Valet & parking plan",
  "Bridal room ready",
  "Rain-backup hall on standby",
  "Welcome & signage placed",
  "Vendor entry passes issued",
];

const STANDARD_TIMELINE: TimelineItem[] = [
  { time: "4:00 PM", item: "Vendor load-in & décor setup" },
  { time: "6:30 PM", item: "Guest arrival & welcome drinks" },
  { time: "7:30 PM", item: "Baraat / entry procession" },
  { time: "8:30 PM", item: "Stage ceremony & varmala" },
  { time: "9:30 PM", item: "Dinner service opens" },
  { time: "11:30 PM", item: "Pheras / main ceremony" },
];

const VENDOR_OPTIONS: VendorOption[] = DEMO_VENDORS.map((v) => ({
  id: v.id,
  name: v.name,
  category: v.category,
  preferred: v.preferred,
}));

function buildChecklist(done: number, total: number): ChecklistItem[] {
  const labels = STANDARD_CHECKLIST.slice(0, Math.max(total, 1));
  return labels.map((label, i) => ({ label, done: i < done }));
}

/** Deep-clone the standard menu so each event gets its own selection state. */
function freshMenu(): MenuCourse[] {
  return STANDARD_MENU_COURSES.map((c) => ({
    course: c.course,
    items: c.items.map((it) => ({ ...it })),
  }));
}

/** Map the demo events into the richer detail shape the board renders. */
function demoEvents(): EventDetail[] {
  const spaceByCouple: Record<string, { space: string; guests: number; type: string }> = {
    "Riya & Sameer": { space: "The Grand Lawn", guests: 500, type: "wedding" },
    "Ishita & Karan": { space: "Crystal Banquet Hall", guests: 700, type: "wedding" },
  };
  return DEMO_EVENTS.map((e, idx) => {
    const meta = spaceByCouple[e.coupleName];
    // Seed a couple of selections + one vendor on the first demo event so the
    // UI reads as "in progress" rather than empty.
    const menuCourses = freshMenu();
    const rooming: RoomingRow[] =
      idx === 0
        ? [
            { guest: "Groom's family (Sharma)", roomType: "Premium Suites", nights: 2, checkIn: e.eventDate },
            { guest: "Bride's family (Verma)", roomType: "Garden View Rooms", nights: 2, checkIn: e.eventDate },
          ]
        : [];
    const vendors: VendorAssignment[] =
      idx === 0
        ? [
            { vendorId: "vn_1", name: "Lens & Light Studio", category: "photographer", role: "Lead photographer" },
            { vendorId: "vn_2", name: "Maharaja Caterers", category: "caterer", role: "Catering partner" },
          ]
        : [];
    if (idx === 0) {
      menuCourses[0].items[0].selected = true;
      menuCourses[2].items[0].selected = true;
      menuCourses[4].items[0].selected = true;
      menuCourses[4].items[2].selected = true;
    }
    return {
      id: e.id,
      bookingId: null,
      coupleName: e.coupleName,
      eventType: meta?.type ?? "wedding",
      eventDate: e.eventDate,
      spaceName: meta?.space ?? null,
      guestCount: meta?.guests ?? null,
      checklist: buildChecklist(e.checklistDone, e.checklistTotal),
      timeline: STANDARD_TIMELINE,
      menuCourses,
      rooming,
      vendors,
      menuNotes: idx === 0 ? "≈320 veg · 180 non-veg. 2 Jain thalis at family table." : "",
      decorNotes: "",
      daySheetUrl: null,
      isDemo: true,
    } satisfies EventDetail;
  });
}

function coerceMenuCourses(menu: Record<string, unknown> | null): MenuCourse[] {
  const raw = (menu?.courses ?? null) as MenuCourse[] | null;
  if (Array.isArray(raw) && raw.length) return raw;
  return freshMenu();
}

function coerceVendors(menu: Record<string, unknown> | null): VendorAssignment[] {
  const raw = (menu?.vendors ?? null) as VendorAssignment[] | null;
  return Array.isArray(raw) ? raw : [];
}

function coerceRooming(roomingList: Record<string, unknown> | null): RoomingRow[] {
  const raw = (roomingList?.rows ?? null) as RoomingRow[] | null;
  return Array.isArray(raw) ? raw : [];
}

async function loadVendorOptions(orgId: string): Promise<VendorOption[]> {
  const rows = await getDb()
    .select({
      id: schema.vendors.id,
      name: schema.vendors.name,
      category: schema.vendors.category,
      preferred: schema.vendors.preferred,
    })
    .from(schema.vendors)
    .where(eq(schema.vendors.organizationId, orgId))
    .orderBy(desc(schema.vendors.preferred));
  return rows.length ? rows : VENDOR_OPTIONS;
}

async function loadEvents(orgId: string): Promise<EventDetail[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.events.id,
      bookingId: schema.events.bookingId,
      checklist: schema.events.checklist,
      timeline: schema.events.timeline,
      menu: schema.events.menu,
      decorNotes: schema.events.decorNotes,
      roomingList: schema.events.roomingList,
      daySheetUrl: schema.events.daySheetUrl,
      eventType: schema.bookings.eventType,
      eventDate: schema.bookings.eventDate,
      coupleName: schema.leads.coupleName,
      guestCount: schema.leads.guestCount,
    })
    .from(schema.events)
    .innerJoin(schema.bookings, eq(schema.events.bookingId, schema.bookings.id))
    .leftJoin(
      schema.leads,
      and(
        eq(schema.bookings.leadId, schema.leads.id),
        eq(schema.leads.organizationId, orgId),
      ),
    )
    .where(eq(schema.events.organizationId, orgId))
    .orderBy(desc(schema.bookings.eventDate));

  return rows.map((r) => {
    const menu = r.menu as Record<string, unknown> | null;
    return {
      id: r.id,
      bookingId: r.bookingId,
      coupleName: r.coupleName ?? "Unnamed event",
      eventType: r.eventType ?? "wedding",
      eventDate: r.eventDate,
      spaceName: null,
      guestCount: r.guestCount ?? null,
      checklist: (r.checklist ?? []) as ChecklistItem[],
      timeline: (r.timeline ?? []) as TimelineItem[],
      menuCourses: coerceMenuCourses(menu),
      rooming: coerceRooming(r.roomingList as Record<string, unknown> | null),
      vendors: coerceVendors(menu),
      menuNotes: typeof menu?.notes === "string" ? (menu.notes as string) : "",
      decorNotes: r.decorNotes ?? "",
      daySheetUrl: r.daySheetUrl,
      isDemo: false,
    } satisfies EventDetail;
  });
}

export default async function EventsPage() {
  const org = await getActiveOrg();
  const events = org ? await loadEvents(org.id) : demoEvents();
  const vendorOptions = org ? await loadVendorOptions(org.id) : VENDOR_OPTIONS;

  const upcoming = events.length;
  const itemsDone = events.reduce(
    (n, e) => n + e.checklist.filter((c) => c.done).length,
    0,
  );
  const itemsTotal = events.reduce((n, e) => n + e.checklist.length, 0);
  const readyCount = events.filter(
    (e) => e.checklist.length > 0 && e.checklist.every((c) => c.done),
  ).length;
  const prepPct = itemsTotal ? Math.round((itemsDone / itemsTotal) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Events"
        description={
          org
            ? "Run your won bookings — checklist, timeline, menu, rooming, vendors, and day sheets."
            : "Showing demo events. Connect a database to run your real bookings."
        }
      />

      {events.length === 0 ? (
        <EmptyState
          icon={PartyPopper}
          title="No upcoming events yet"
          description="Confirmed bookings become events here, where your team preps each function against a standard run-of-show."
        />
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              icon={CalendarCheck2}
              label="Upcoming events"
              value={upcoming}
              hint="confirmed bookings"
            />
            <Stat
              icon={ListChecks}
              label="Overall prep"
              value={`${prepPct}%`}
              hint={`${itemsDone}/${itemsTotal} tasks`}
            />
            <Stat
              icon={CheckCircle2}
              label="Ready to run"
              value={`${readyCount}/${upcoming}`}
              hint="checklist complete"
            />
          </div>

          <EventsBoard events={events} vendorOptions={vendorOptions} />
        </div>
      )}
    </div>
  );
}
