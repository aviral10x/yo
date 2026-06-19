/** Shared shapes for the Intelligence slice (mirrors the demo-data shapes). */

export type PriceRec = {
  eventType: string;
  season: string;
  current: number;
  suggested: number;
  change: number;
  rationale: string;
};

export type DemandPoint = {
  month: string;
  demand: number;
};

export type LeadTier = "hot" | "warm" | "cold";

export type LeadScore = {
  id: string;
  coupleName: string;
  score: number;
  tier: LeadTier;
  reasons: string[];
};
