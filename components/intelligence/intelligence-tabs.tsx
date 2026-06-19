"use client";

import { CalendarRange, IndianRupee, Target } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemandPanel } from "./demand-panel";
import { LeadScoringPanel } from "./lead-scoring-panel";
import { PricingPanel } from "./pricing-panel";
import type { DemandPoint, LeadScore, PriceRec } from "./types";

export function IntelligenceTabs({
  priceRecs,
  demand,
  leadScores,
}: {
  priceRecs: PriceRec[];
  demand: DemandPoint[];
  leadScores: LeadScore[];
}) {
  return (
    <Tabs defaultValue="pricing" className="gap-6">
      <TabsList className="w-full max-w-md">
        <TabsTrigger value="pricing">
          <IndianRupee className="size-4" />
          Pricing
        </TabsTrigger>
        <TabsTrigger value="demand">
          <CalendarRange className="size-4" />
          Demand
        </TabsTrigger>
        <TabsTrigger value="scoring">
          <Target className="size-4" />
          Lead scoring
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pricing">
        <PricingPanel recs={priceRecs} />
      </TabsContent>
      <TabsContent value="demand">
        <DemandPanel data={demand} />
      </TabsContent>
      <TabsContent value="scoring">
        <LeadScoringPanel scores={leadScores} />
      </TabsContent>
    </Tabs>
  );
}
