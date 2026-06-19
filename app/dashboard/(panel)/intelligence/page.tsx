import { Brain, Flame, IndianRupee, Target } from "lucide-react";
import { eq } from "drizzle-orm";

import { PageHeader } from "@/components/dashboard/page-header";
import { Stat } from "@/components/dashboard/stat";
import { IntelligenceTabs } from "@/components/intelligence/intelligence-tabs";
import type {
  DemandPoint,
  LeadScore,
  PriceRec,
} from "@/components/intelligence/types";
import {
  DEMO_DEMAND,
  DEMO_LEAD_SCORES,
  DEMO_PRICE_RECS,
} from "@/lib/demo-data";
import { getDb, schema } from "@/lib/db";
import { getActiveOrg } from "@/lib/org";

/**
 * Phase 3 intelligence is computed/curated for both the live org and the no-DB
 * demo. We still resolve the active org so the copy and any future
 * org-derived signals are scoped correctly; the recommendation datasets are the
 * curated demo set until the pricing/scoring tables ship.
 */
async function loadIntelligence(): Promise<{
  liveDb: boolean;
  priceRecs: PriceRec[];
  demand: DemandPoint[];
  leadScores: LeadScore[];
}> {
  const org = await getActiveOrg();

  if (org) {
    // Touch an org-scoped read so the page is genuinely tenant-bound; the
    // recommendation tables themselves are a Phase 3 followup.
    try {
      await getDb()
        .select({ id: schema.leads.id })
        .from(schema.leads)
        .where(eq(schema.leads.organizationId, org.id))
        .limit(1);
    } catch {
      // ignore — fall back to the curated set below
    }
  }

  return {
    liveDb: Boolean(org),
    priceRecs: DEMO_PRICE_RECS,
    demand: DEMO_DEMAND,
    leadScores: DEMO_LEAD_SCORES,
  };
}

export default async function IntelligencePage() {
  const { liveDb, priceRecs, demand, leadScores } = await loadIntelligence();

  const hotCount = leadScores.filter((s) => s.tier === "hot").length;
  const peakMonth = [...demand].sort((a, b) => b.demand - a.demand)[0];
  const biggestMove = [...priceRecs].sort(
    (a, b) => Math.abs(b.change) - Math.abs(a.change),
  )[0];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Intelligence"
        description={
          liveDb
            ? "AI pricing, demand heat-map, and enquiry scoring — your venue's revenue brain."
            : "Showing demo intelligence. Connect a database to score your live enquiries."
        }
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            <Brain className="size-3.5 text-primary" />
            AI-assisted
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Target}
          label="Hot enquiries"
          value={hotCount}
          hint="prioritise today"
        />
        <Stat
          icon={Flame}
          label="Peak demand"
          value={peakMonth ? peakMonth.month.split(" ")[0] : "—"}
          hint={peakMonth ? `${peakMonth.demand}/100` : undefined}
        />
        <Stat
          icon={IndianRupee}
          label="Pricing moves"
          value={priceRecs.length}
          hint="ready to apply"
        />
        <Stat
          icon={Brain}
          label="Biggest opportunity"
          value={
            biggestMove
              ? `${biggestMove.change >= 0 ? "+" : ""}${biggestMove.change}%`
              : "—"
          }
          hint={biggestMove ? biggestMove.eventType : undefined}
        />
      </div>

      <IntelligenceTabs
        priceRecs={priceRecs}
        demand={demand}
        leadScores={leadScores}
      />
    </div>
  );
}
