import { CalendarCheck, CalendarClock, CalendarX2, LayoutGrid } from "lucide-react";
import { eq } from "drizzle-orm";

import {
  AvailabilityCalendar,
  type CalendarBlock,
  type CalendarSpace,
} from "@/components/calendar/availability-calendar";
import { AvailabilityChecker } from "@/components/calendar/availability-checker";
import { PageHeader } from "@/components/dashboard/page-header";
import { Stat } from "@/components/dashboard/stat";
import { getDb, schema } from "@/lib/db";
import { DEMO_CALENDAR, DEMO_SPACES } from "@/lib/demo-data";
import { getActiveOrg } from "@/lib/org";

export const metadata = { title: "Calendar · VenuePilot" };

export default async function CalendarPage() {
  const org = await getActiveOrg();

  let spaces: CalendarSpace[];
  let blocks: CalendarBlock[];

  if (org) {
    const db = getDb();
    const [spaceRows, blockRows] = await Promise.all([
      db
        .select({ id: schema.spaces.id, name: schema.spaces.name })
        .from(schema.spaces)
        .where(eq(schema.spaces.organizationId, org.id)),
      db
        .select({
          date: schema.calendarBlocks.date,
          spaceId: schema.calendarBlocks.spaceId,
          kind: schema.calendarBlocks.kind,
        })
        .from(schema.calendarBlocks)
        .where(eq(schema.calendarBlocks.organizationId, org.id)),
    ]);
    spaces = spaceRows;
    blocks = blockRows as CalendarBlock[];
  } else {
    spaces = DEMO_SPACES.map((s) => ({ id: s.id, name: s.name }));
    blocks = DEMO_CALENDAR;
  }

  const holds = blocks.filter((b) => b.kind === "hold").length;
  const confirmed = blocks.filter((b) => b.kind === "confirmed").length;
  const blackouts = blocks.filter((b) => b.kind === "blackout").length;

  // Position the calendar on the soonest upcoming occupied month so demo data
  // is visible immediately; fall back to today.
  const upcoming = blocks
    .map((b) => b.date)
    .filter((d) => d >= new Date().toISOString().slice(0, 10))
    .sort()[0];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Calendar"
        description={
          org
            ? "Availability across every space — holds, confirmed bookings, and blackouts."
            : "Showing demo availability. Connect a database to manage real bookings."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={LayoutGrid}
          label="Spaces"
          value={spaces.length}
          hint="bookable"
        />
        <Stat
          icon={CalendarClock}
          label="Provisional holds"
          value={holds}
          hint="awaiting deposit"
        />
        <Stat
          icon={CalendarCheck}
          label="Confirmed dates"
          value={confirmed}
          hint="locked in"
        />
        <Stat
          icon={CalendarX2}
          label="Blackouts"
          value={blackouts}
          hint="unavailable"
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.05fr]">
        <AvailabilityCalendar
          spaces={spaces}
          blocks={blocks}
          defaultMonth={upcoming}
        />
        <AvailabilityChecker hasSpaces={spaces.length > 0} defaultDate={upcoming} />
      </div>
    </div>
  );
}
