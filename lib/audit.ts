import "server-only";

import { anthropicConfigured, generateObject } from "@/lib/ai/claude";

/**
 * AI growth audit for a wedding venue — the lead-gen wedge (Owner.com's
 * "grader" move). Scores the venue's online presence across the dimensions
 * that drive direct bookings, with concrete fixes. Runs on Claude (also
 * available via AWS Bedrock); falls back to a heuristic estimate when no key.
 */

export type AuditStatus = "strong" | "needs_work" | "critical";

export interface AuditInput {
  venue: string;
  city?: string;
  url?: string;
  instagram?: string;
  phone?: string;
}

export interface AuditDimension {
  key: string;
  label: string;
  score: number;
  status: AuditStatus;
  finding: string;
  recommendation: string;
}

export interface AuditFix {
  title: string;
  impact: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
}

export interface AuditResult {
  venue: string;
  city?: string;
  overallScore: number;
  grade: "A" | "B" | "C" | "D";
  headline: string;
  summary: string;
  dimensions: AuditDimension[];
  topFixes: AuditFix[];
  estimatedUpside: string;
  generatedByAI: boolean;
}

export const AUDIT_DIMENSIONS: { key: string; label: string }[] = [
  { key: "gbp", label: "Google Business Profile" },
  { key: "photos", label: "Photo quality & coverage" },
  { key: "reviews", label: "Reviews & responses" },
  { key: "packages", label: "Package & price visibility" },
  { key: "site_visit", label: "Site-visit booking CTA" },
  { key: "availability", label: "Date availability check" },
  { key: "instagram", label: "Instagram activity" },
  { key: "enquiry_flow", label: "Enquiry → booking flow" },
];

const LABEL = new Map(AUDIT_DIMENSIONS.map((d) => [d.key, d.label]));

export function gradeFor(score: number): AuditResult["grade"] {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

/** Best-effort fetch of the venue's site so the audit is grounded in reality. */
async function fetchSiteText(url?: string): Promise<string> {
  if (!url) return "";
  let target = url.trim();
  if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return "";
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { "user-agent": "VenuePilotAuditBot/1.0" },
    });
    clearTimeout(timer);
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);
  } catch {
    return "";
  }
}

const AUDIT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    overallScore: { type: "integer", minimum: 0, maximum: 100 },
    headline: {
      type: "string",
      description: "One punchy sentence summarizing the biggest opportunity.",
    },
    summary: { type: "string", description: "2-3 sentence overview." },
    dimensions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          key: {
            type: "string",
            enum: AUDIT_DIMENSIONS.map((d) => d.key),
          },
          score: { type: "integer", minimum: 0, maximum: 100 },
          status: { type: "string", enum: ["strong", "needs_work", "critical"] },
          finding: { type: "string", description: "What's wrong/right today." },
          recommendation: { type: "string", description: "Specific fix." },
        },
        required: ["key", "score", "status", "finding", "recommendation"],
      },
    },
    topFixes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          impact: { type: "string", enum: ["high", "medium", "low"] },
          effort: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["title", "impact", "effort"],
      },
    },
    estimatedUpside: {
      type: "string",
      description: "Plausible business upside, e.g. '~20% more direct enquiries'.",
    },
  },
  required: [
    "overallScore",
    "headline",
    "summary",
    "dimensions",
    "topFixes",
    "estimatedUpside",
  ],
};

export async function generateAudit(input: AuditInput): Promise<AuditResult> {
  if (!anthropicConfigured) return heuristicAudit(input);

  const siteText = await fetchSiteText(input.url);
  const prompt = [
    `Audit this Indian wedding venue's online presence and conversion readiness.`,
    `Venue: ${input.venue}`,
    input.city ? `City: ${input.city}` : null,
    input.url ? `Website/Maps: ${input.url}` : `Website: (none provided)`,
    input.instagram ? `Instagram: ${input.instagram}` : null,
    siteText
      ? `\nFetched website text (truncated):\n"""${siteText}"""`
      : `\nNo website content could be fetched — treat the online presence as weak/unknown and score accordingly.`,
    `\nScore each of these 8 dimensions 0-100 with a status and a specific, India-relevant fix: ${AUDIT_DIMENSIONS.map((d) => `${d.key} (${d.label})`).join(", ")}.`,
    `Be concrete and honest. Most independent venues score poorly on availability checking, package visibility, and review responses. Give a realistic overall score, a headline, a 2-3 sentence summary, 3-5 prioritized top fixes, and an estimated business upside.`,
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await generateObject<{
    overallScore: number;
    headline: string;
    summary: string;
    dimensions: Omit<AuditDimension, "label">[];
    topFixes: AuditFix[];
    estimatedUpside: string;
  }>({
    prompt,
    schema: AUDIT_SCHEMA,
    toolName: "venue_growth_audit",
    toolDescription: "Return a structured growth audit for the venue.",
    system:
      "You are a senior growth consultant for wedding venues in India. You give blunt, specific, actionable assessments — never generic filler.",
    tier: "sonnet",
    maxTokens: 2500,
  });

  return {
    venue: input.venue,
    city: input.city,
    overallScore: clamp(raw.overallScore),
    grade: gradeFor(raw.overallScore),
    headline: raw.headline,
    summary: raw.summary,
    dimensions: raw.dimensions.map((d) => ({
      ...d,
      score: clamp(d.score),
      label: LABEL.get(d.key) ?? d.key,
    })),
    topFixes: raw.topFixes,
    estimatedUpside: raw.estimatedUpside,
    generatedByAI: true,
  };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Deterministic fallback when no AI key is configured — still useful. */
function heuristicAudit(input: AuditInput): AuditResult {
  const hasUrl = !!input.url;
  const hasInsta = !!input.instagram;
  const d = (
    key: string,
    score: number,
    status: AuditStatus,
    finding: string,
    recommendation: string,
  ): AuditDimension => ({
    key,
    label: LABEL.get(key) ?? key,
    score,
    status,
    finding,
    recommendation,
  });

  const dimensions: AuditDimension[] = [
    d(
      "gbp",
      hasUrl ? 55 : 35,
      hasUrl ? "needs_work" : "critical",
      "Google Business Profile is likely incomplete — missing categories, hours, or booking links.",
      "Claim and complete the profile; add booking and enquiry links and the full photo pack.",
    ),
    d(
      "photos",
      50,
      "needs_work",
      "Photo coverage is probably partial — couples can't see lawn, stage, rooms, and rain backup.",
      "Shoot the standard 12-shot venue photo pack and keep it current.",
    ),
    d(
      "reviews",
      40,
      "critical",
      "Reviews are likely sparse and largely unanswered.",
      "Request reviews after every event and respond to each within 24 hours.",
    ),
    d(
      "packages",
      35,
      "critical",
      "Package ranges and inclusions are not clearly visible online.",
      "Publish transparent package ranges so couples self-qualify before enquiring.",
    ),
    d(
      "site_visit",
      30,
      "critical",
      "No clear site-visit booking CTA.",
      "Add a one-tap 'Book a site visit' CTA with calendar scheduling.",
    ),
    d(
      "availability",
      25,
      "critical",
      "Couples cannot check date availability — the #1 source of venue frustration.",
      "Let couples check if their date is free instantly, with a provisional hold.",
    ),
    d(
      "instagram",
      hasInsta ? 60 : 40,
      hasInsta ? "needs_work" : "critical",
      hasInsta
        ? "Instagram exists but likely posts irregularly."
        : "No active Instagram presence found.",
      "Post 3x/week with AI-assisted captions and reels from your media library.",
    ),
    d(
      "enquiry_flow",
      35,
      "critical",
      "Enquiries scatter across calls, WhatsApp, and spreadsheets — leads leak.",
      "Centralize every enquiry into one pipeline with fast templated responses.",
    ),
  ];

  const overall = clamp(
    dimensions.reduce((s, x) => s + x.score, 0) / dimensions.length,
  );

  return {
    venue: input.venue,
    city: input.city,
    overallScore: overall,
    grade: gradeFor(overall),
    headline:
      "You're losing direct bookings to slow responses and an invisible booking flow.",
    summary:
      "Your online presence makes it hard for couples to check dates, see packages, and book a visit — so they go elsewhere or you pay marketplaces for the same leads. The fixes below recover demand you're already generating.",
    dimensions,
    topFixes: [
      { title: "Add instant date-availability checking", impact: "high", effort: "medium" },
      { title: "Publish transparent package ranges", impact: "high", effort: "low" },
      { title: "Centralize enquiries into one fast pipeline", impact: "high", effort: "medium" },
      { title: "Request & respond to reviews", impact: "medium", effort: "low" },
    ],
    estimatedUpside:
      "Capture an estimated 15-25% more direct enquiries and cut response time from hours to minutes.",
    generatedByAI: false,
  };
}
