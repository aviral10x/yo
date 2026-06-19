import {
  ArrowUpRight,
  CalendarCheck,
  Clock,
  IndianRupee,
  Inbox,
  TrendingUp,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuthContext } from "@/lib/auth";
import { LEAD_STAGES } from "@/lib/constants";

const METRICS = [
  { label: "Time to first response", value: "—", icon: Clock, hint: "target: < 5 min" },
  { label: "Lead → site visit", value: "—", icon: CalendarCheck, hint: "this month" },
  { label: "Site visit → deposit", value: "—", icon: IndianRupee, hint: "this month" },
  { label: "Direct lead share", value: "—", icon: TrendingUp, hint: "vs marketplace" },
];

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
  const { configured, orgId } = await getAuthContext();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          {configured
            ? orgId
              ? "Here's how your venue is converting."
              : "Select or create an organization to get started."
            : "Connect Clerk to load your organization. The UI below is live."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => (
          <Card key={m.label} className="border-border/70">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <m.icon className="size-[18px]" />
                </span>
                <span className="text-xs text-muted-foreground">{m.hint}</span>
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums">{m.value}</p>
              <p className="text-sm text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
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
                <p className="mt-1 text-2xl font-semibold tabular-nums">0</p>
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
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Inbox className="size-6" />
              </span>
              <div>
                <p className="font-medium">No enquiries yet</p>
                <p className="text-sm text-muted-foreground">
                  New leads from your website, WhatsApp, and marketplaces land here.
                </p>
              </div>
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
                <ArrowUpRight className="ml-auto size-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
