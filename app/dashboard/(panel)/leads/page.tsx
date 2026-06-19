import { CalendarClock, Sparkles, TrendingUp, Users } from "lucide-react";
import { desc, eq } from "drizzle-orm";

import { PageHeader } from "@/components/dashboard/page-header";
import { Stat } from "@/components/dashboard/stat";
import { Card, CardContent } from "@/components/ui/card";
import { LeadsBoard } from "@/components/leads/leads-board";
import { NewLeadDialog } from "@/components/leads/new-lead-dialog";
import {
  STAGE_LABEL,
  STAGE_TONE,
  type LeadRow,
  type LeadStage,
} from "@/components/leads/lead-types";
import { LEAD_STAGES } from "@/lib/constants";
import { DEMO_LEADS } from "@/lib/demo-data";
import { getDb, schema } from "@/lib/db";
import { getActiveOrg } from "@/lib/org";
import { cn } from "@/lib/utils";

/** Stages that count as "open" pipeline (not yet won or lost). */
const OPEN_STAGES = new Set<LeadStage>([
  "new",
  "qualified",
  "site_visit",
  "quoted",
  "hold",
]);

function toIso(d: unknown): string | null {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString();
  return String(d);
}

async function loadLeads(): Promise<{ leads: LeadRow[]; liveDb: boolean }> {
  const org = await getActiveOrg();
  if (!org) {
    return {
      liveDb: false,
      leads: DEMO_LEADS.map((l) => ({
        id: l.id,
        coupleName: l.coupleName,
        phone: l.phone,
        email: l.email,
        source: l.source,
        eventType: l.eventType,
        dateRequested: l.dateRequested,
        guestCount: l.guestCount,
        stage: l.stage,
        createdAt: l.createdAt,
      })),
    };
  }

  const rows = await getDb()
    .select()
    .from(schema.leads)
    .where(eq(schema.leads.organizationId, org.id))
    .orderBy(desc(schema.leads.createdAt));

  return {
    liveDb: true,
    leads: rows.map((r) => ({
      id: r.id,
      coupleName: r.coupleName ?? "Unnamed enquiry",
      phone: r.phone ?? "",
      email: r.email ?? undefined,
      source: r.source,
      eventType: r.eventType ?? "wedding",
      dateRequested: toIso(r.dateRequested),
      guestCount: r.guestCount,
      stage: r.stage as LeadStage,
      createdAt: toIso(r.createdAt) ?? new Date().toISOString(),
    })),
  };
}

export default async function LeadsPage() {
  const { leads, liveDb } = await loadLeads();

  const counts = new Map<string, number>();
  for (const l of leads) counts.set(l.stage, (counts.get(l.stage) ?? 0) + 1);

  const total = leads.length;
  const openCount = leads.filter((l) => OPEN_STAGES.has(l.stage)).length;
  const newCount = counts.get("new") ?? 0;
  const wonAndDeposit = (counts.get("confirmed") ?? 0) + (counts.get("deposit") ?? 0);
  const decided = wonAndDeposit + (counts.get("lost") ?? 0);
  const winRate = decided > 0 ? Math.round((wonAndDeposit / decided) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Leads"
        description={
          liveDb
            ? "Capture, qualify, and move every enquiry toward a confirmed booking."
            : "Showing demo enquiries. Connect a database to capture live leads."
        }
        action={<NewLeadDialog />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Total enquiries" value={total} hint="all time" />
        <Stat
          icon={CalendarClock}
          label="Open pipeline"
          value={openCount}
          hint="awaiting action"
        />
        <Stat
          icon={Sparkles}
          label="New & unworked"
          value={newCount}
          hint="reply fast"
        />
        <Stat
          icon={TrendingUp}
          label="Win rate"
          value={`${winRate}%`}
          hint="deposit or confirmed"
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Pipeline</h2>
          <span className="text-xs text-muted-foreground">
            enquiry → confirmed
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {LEAD_STAGES.map((s) => {
            const tone = STAGE_TONE[s.value];
            return (
              <Card
                key={s.value}
                className="overflow-hidden border-border/70 py-0"
              >
                <div className={cn("h-1", tone.dot)} />
                <CardContent className="px-4 py-3.5">
                  <p className="truncate text-xs text-muted-foreground">
                    {STAGE_LABEL[s.value]}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {counts.get(s.value) ?? 0}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <LeadsBoard leads={leads} liveDb={liveDb} />
    </div>
  );
}
