import { CalendarCheck, Clock, IndianRupee, TrendingUp } from "lucide-react";

import { Stat } from "@/components/dashboard/stat";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LEAD_STAGES } from "@/lib/constants";
import { DEMO_LEADS, DEMO_METRICS, DEMO_PIPELINE } from "@/lib/demo-data";
import { getActiveOrg } from "@/lib/org";
import { formatDate } from "@/lib/format";

const PIPELINE_TONE: Record<string, string> = {
  new: "bg-sky-500",
  qualified: "bg-indigo-500",
  site_visit: "bg-amber-500",
  quoted: "bg-violet-500",
  hold: "bg-orange-500",
  deposit: "bg-emerald-500",
  confirmed: "bg-emerald-600",
  lost: "bg-muted-foreground/40",
};

export default async function DashboardOverview() {
  const org = await getActiveOrg();
  // Live org → real queries land here in the slices; otherwise demo data.
  const m = DEMO_METRICS;
  const counts = new Map(DEMO_PIPELINE.map((p) => [p.stage, p.count]));
  const recent = DEMO_LEADS.slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          {org
            ? "Here's how your venue is converting."
            : "Showing demo data. Connect Clerk + a database to go live."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Clock} label="Time to first response" value={m.firstResponse} hint="target < 5 min" />
        <Stat icon={CalendarCheck} label="Lead → site visit" value={m.leadToVisit} hint="this month" />
        <Stat icon={IndianRupee} label="Site visit → deposit" value={m.visitToDeposit} hint="this month" />
        <Stat icon={TrendingUp} label="Direct lead share" value={m.directShare} hint="vs marketplace" />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Conversion pipeline</h2>
          <span className="text-xs text-muted-foreground">enquiry → confirmed</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {LEAD_STAGES.map((s) => (
            <Card key={s.value} className="overflow-hidden border-border/70">
              <div className={`h-1 ${PIPELINE_TONE[s.value] ?? "bg-primary"}`} />
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {counts.get(s.value) ?? 0}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base">Recent enquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {recent.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-3 first:pt-0">
                  <div>
                    <p className="text-sm font-medium">{l.coupleName}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.guestCount} guests · {formatDate(l.dateRequested)} ·{" "}
                      <span className="capitalize">{l.source}</span>
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                    {l.stage.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base">Get set up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              "Publish your venue website",
              "Add spaces & capacities",
              "Set package ranges",
              "Connect WhatsApp",
              "Invite your team",
            ].map((step, i) => (
              <div key={step} className="flex items-center gap-3 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs text-muted-foreground">
                  {i + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
