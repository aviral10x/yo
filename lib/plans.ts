/**
 * Commercial model — plans + entitlements (IMPLEMENTATION_PLAN.md §9).
 *
 * Single source of truth for feature gating. Never scatter `if (plan === ...)`
 * checks across the app; call `hasFeature(plan, feature)` instead.
 */
export type Plan = "starter" | "growth" | "portfolio";

export const FEATURES = [
  "website",
  "crm",
  "calendar",
  "proposals",
  "deposits",
  "gbp_pack",
  "reviews",
  "wa_templates",
  "room_inventory",
  "package_builder",
  "event_sheets",
  "vendors",
  "content_studio",
  "analytics",
  "multi_property",
  "team_inbox",
  "roles",
  "central_reporting",
  "bulk_ops",
] as const;

export type Feature = (typeof FEATURES)[number];

const STARTER: Feature[] = [
  "website",
  "crm",
  "calendar",
  "proposals",
  "deposits",
  "gbp_pack",
  "reviews",
  "wa_templates",
];

const GROWTH: Feature[] = [
  ...STARTER,
  "room_inventory",
  "package_builder",
  "event_sheets",
  "vendors",
  "content_studio",
  "analytics",
];

const PORTFOLIO: Feature[] = [
  ...GROWTH,
  "multi_property",
  "team_inbox",
  "roles",
  "central_reporting",
  "bulk_ops",
];

export const PLAN_FEATURES: Record<Plan, Feature[]> = {
  starter: STARTER,
  growth: GROWTH,
  portfolio: PORTFOLIO,
};

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return PLAN_FEATURES[plan].includes(feature);
}

export interface PlanMeta {
  label: string;
  tagline: string;
  /** Indicative monthly price in INR — placeholder until pricing is set. */
  monthlyInr: number;
  segment: string;
}

export const PLAN_META: Record<Plan, PlanMeta> = {
  starter: {
    label: "Starter",
    tagline: "Single lawns & banquet gardens",
    monthlyInr: 4999,
    segment: "One property: website, lead capture, calendar, proposals, deposits.",
  },
  growth: {
    label: "Growth",
    tagline: "Wedding resorts & farmhouses",
    monthlyInr: 9999,
    segment: "Adds room inventory, package builder, event sheets, content studio.",
  },
  portfolio: {
    label: "Portfolio",
    tagline: "Owners with multiple venues",
    monthlyInr: 19999,
    segment: "Multi-property dashboard, shared inbox, roles, central reporting.",
  },
};
