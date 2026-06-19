import {
  BarChart3,
  Building2,
  CalendarCheck,
  Gauge,
  IndianRupee,
  Inbox,
} from "lucide-react";
import { and, eq, inArray, sql } from "drizzle-orm";

import { PageHeader } from "@/components/dashboard/page-header";
import { Stat } from "@/components/dashboard/stat";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CentralReport } from "@/components/portfolio/central-report";
import { ComparisonChart } from "@/components/portfolio/comparison-chart";
import { PropertiesTable } from "@/components/portfolio/properties-table";
import type { PropertyRow } from "@/components/portfolio/property-types";
import { DEMO_PROPERTIES } from "@/lib/demo-data";
import { getDb, schema } from "@/lib/db";
import { getActiveOrg } from "@/lib/org";
import { formatINRShort } from "@/lib/format";

/** Days ahead we sample the calendar over to derive an occupancy rate. */
const OCCUPANCY_WINDOW_DAYS = 90;

/**
 * Build per-property aggregates for the active org from real tables. Each venue
 * gets its own enquiry/booking counts, paid revenue, and a calendar-derived
 * occupancy rate. Everything is scoped to org.id at the source.
 */
async function loadFromDb(orgId: string): Promise<PropertyRow[]> {
  const db = getDb();

  const venues = await db
    .select({
      id: schema.venues.id,
      slug: schema.venues.slug,
      name: schema.venues.name,
      city: schema.venues.city,
      type: schema.venues.type,
    })
    .from(schema.venues)
    .where(eq(schema.venues.organizationId, orgId));

  if (venues.length === 0) return [];

  const venueIds = venues.map((v) => v.id);

  // Enquiries per venue.
  const leadRows = await db
    .select({
      venueId: schema.leads.venueId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(schema.leads)
    .where(eq(schema.leads.organizationId, orgId))
    .groupBy(schema.leads.venueId);
  const enquiriesByVenue = new Map(leadRows.map((r) => [r.venueId, r.count]));

  // Confirmed bookings per venue.
  const bookingRows = await db
    .select({
      venueId: schema.bookings.venueId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(schema.bookings)
    .where(
      and(
        eq(schema.bookings.organizationId, orgId),
        eq(schema.bookings.status, "confirmed"),
      ),
    )
    .groupBy(schema.bookings.venueId);
  const bookingsByVenue = new Map(bookingRows.map((r) => [r.venueId, r.count]));

  // Paid revenue per venue (payments → booking → venue).
  const revenueRows = await db
    .select({
      venueId: schema.bookings.venueId,
      total: sql<number>`coalesce(sum(${schema.payments.amount}), 0)`.mapWith(
        Number,
      ),
    })
    .from(schema.payments)
    .innerJoin(
      schema.bookings,
      eq(schema.payments.bookingId, schema.bookings.id),
    )
    .where(
      and(
        eq(schema.payments.organizationId, orgId),
        eq(schema.payments.status, "paid"),
      ),
    )
    .groupBy(schema.bookings.venueId);
  const revenueByVenue = new Map(revenueRows.map((r) => [r.venueId, r.total]));

  // Occupancy: confirmed calendar days in the upcoming window per venue.
  const occupiedRows = await db
    .select({
      venueId: schema.calendarBlocks.venueId,
      days: sql<number>`count(*)`.mapWith(Number),
    })
    .from(schema.calendarBlocks)
    .where(
      and(
        eq(schema.calendarBlocks.organizationId, orgId),
        inArray(schema.calendarBlocks.venueId, venueIds),
        eq(schema.calendarBlocks.kind, "confirmed"),
        sql`${schema.calendarBlocks.date} >= current_date`,
        sql`${schema.calendarBlocks.date} < current_date + ${OCCUPANCY_WINDOW_DAYS}`,
      ),
    )
    .groupBy(schema.calendarBlocks.venueId);
  const occupiedByVenue = new Map(occupiedRows.map((r) => [r.venueId, r.days]));

  return venues.map((v) => {
    const occupiedDays = occupiedByVenue.get(v.id) ?? 0;
    const occupancy = Math.round(
      (occupiedDays / OCCUPANCY_WINDOW_DAYS) * 100,
    );
    return {
      id: v.id,
      slug: v.slug,
      name: v.name,
      city: v.city ?? "—",
      type: v.type,
      enquiries: enquiriesByVenue.get(v.id) ?? 0,
      bookings: bookingsByVenue.get(v.id) ?? 0,
      occupancy: Math.min(occupancy, 100),
      revenue: revenueByVenue.get(v.id) ?? 0,
    } satisfies PropertyRow;
  });
}

async function loadProperties(): Promise<{
  properties: PropertyRow[];
  liveDb: boolean;
}> {
  const org = await getActiveOrg();
  if (!org) {
    return { liveDb: false, properties: DEMO_PROPERTIES as PropertyRow[] };
  }
  return { liveDb: true, properties: await loadFromDb(org.id) };
}

export default async function PortfolioPage() {
  const { properties, liveDb } = await loadProperties();

  const totalVenues = properties.length;
  const totalEnquiries = properties.reduce((s, p) => s + p.enquiries, 0);
  const totalBookings = properties.reduce((s, p) => s + p.bookings, 0);
  const totalRevenue = properties.reduce((s, p) => s + p.revenue, 0);
  const avgOccupancy =
    totalVenues > 0
      ? Math.round(
          properties.reduce((s, p) => s + p.occupancy, 0) / totalVenues,
        )
      : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Portfolio"
        description={
          liveDb
            ? "All your venues in one view — occupancy, enquiries, and revenue across properties."
            : "Showing demo properties. Connect a database to see your live multi-venue numbers."
        }
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {totalVenues} {totalVenues === 1 ? "property" : "properties"}
          </span>
        }
      />

      {totalVenues === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="Add a venue to start tracking enquiries, bookings, and revenue across your group."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Stat
              icon={Building2}
              label="Venues"
              value={totalVenues}
              hint="in portfolio"
            />
            <Stat
              icon={Inbox}
              label="Total enquiries"
              value={totalEnquiries.toLocaleString("en-IN")}
              hint="all properties"
            />
            <Stat
              icon={CalendarCheck}
              label="Total bookings"
              value={totalBookings.toLocaleString("en-IN")}
              hint="confirmed"
            />
            <Stat
              icon={IndianRupee}
              label="Total revenue"
              value={formatINRShort(totalRevenue)}
              hint="paid to date"
            />
            <Stat
              icon={Gauge}
              label="Avg occupancy"
              value={`${avgOccupancy}%`}
              hint="next 90 days"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="size-4 text-primary" />
                  Property comparison
                </CardTitle>
                <CardDescription>
                  Compare revenue or occupancy side by side.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ComparisonChart properties={properties} />
              </CardContent>
            </Card>

            <CentralReport
              properties={properties}
              totalEnquiries={totalEnquiries}
              totalRevenue={totalRevenue}
            />
          </div>

          <PropertiesTable properties={properties} />
        </>
      )}

      {!liveDb && (
        <p className="text-center text-xs text-muted-foreground">
          These are illustrative demo figures. Connect Clerk + a database to
          replace them with your group&apos;s live performance.
        </p>
      )}
    </div>
  );
}
