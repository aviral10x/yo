import {
  CalendarCheck,
  Clock,
  Filter,
  IndianRupee,
  LineChart,
  PieChart,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Stat } from "@/components/dashboard/stat";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FunnelChart } from "@/components/analytics/funnel-chart";
import { TrendChart } from "@/components/analytics/trend-chart";
import { SourcesChart } from "@/components/analytics/sources-chart";
import { RevenueChart } from "@/components/analytics/revenue-chart";
import { DEMO_ANALYTICS, DEMO_METRICS } from "@/lib/demo-data";
import { getActiveOrg } from "@/lib/org";
import { formatINRShort } from "@/lib/format";

export default async function AnalyticsPage() {
  const org = await getActiveOrg();
  // Real, activity-derived analytics is a Phase 2 followup; for now both the
  // live org and the no-DB demo render the curated dataset.
  const liveDb = Boolean(org);
  const m = DEMO_METRICS;
  const analytics = DEMO_ANALYTICS;

  const totalRevenue = analytics.revenue.reduce((sum, r) => sum + r.value, 0);
  const topStage = analytics.funnel[0]?.count ?? 0;
  const lastStage = analytics.funnel[analytics.funnel.length - 1]?.count ?? 0;
  const overallConversion =
    topStage > 0 ? Math.round((lastStage / topStage) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Analytics"
        description={
          liveDb
            ? "Funnel, response times, lead sources, and revenue — proof it's working."
            : "Showing demo analytics. Connect a database to see your venue's live numbers."
        }
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Last 6 months
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Clock}
          label="Time to first response"
          value={m.firstResponse}
          hint="target < 5 min"
        />
        <Stat
          icon={CalendarCheck}
          label="Lead → site visit"
          value={m.leadToVisit}
          hint="this month"
        />
        <Stat
          icon={IndianRupee}
          label="Site visit → deposit"
          value={m.visitToDeposit}
          hint="this month"
        />
        <Stat
          icon={TrendingUp}
          label="Direct lead share"
          value={m.directShare}
          hint="vs marketplace"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Filter className="size-4 text-primary" />
                  Conversion funnel
                </CardTitle>
                <CardDescription>
                  Where enquiries drop off, from first contact to confirmed.
                </CardDescription>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-2xl font-semibold tabular-nums">
                  {overallConversion}%
                </p>
                <p className="text-xs text-muted-foreground">
                  enquiry → confirmed
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <FunnelChart data={analytics.funnel} />
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="size-4 text-primary" />
              Lead sources
            </CardTitle>
            <CardDescription>
              Direct vs marketplace, by enquiry volume.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SourcesChart data={analytics.bySource} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LineChart className="size-4 text-primary" />
              Enquiries vs bookings
            </CardTitle>
            <CardDescription>
              Monthly enquiry volume against confirmed bookings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={analytics.monthly} />
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <IndianRupee className="size-4 text-primary" />
                  Booked revenue
                </CardTitle>
                <CardDescription>
                  Confirmed booking value by month.
                </CardDescription>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-2xl font-semibold tabular-nums">
                  {formatINRShort(totalRevenue)}
                </p>
                <p className="text-xs text-muted-foreground">last 6 months</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart data={analytics.revenue} />
          </CardContent>
        </Card>
      </div>

      {!liveDb && (
        <p className="text-center text-xs text-muted-foreground">
          These are illustrative demo figures. Connect Clerk + a database to
          replace them with your venue&apos;s live performance.
        </p>
      )}
    </div>
  );
}
