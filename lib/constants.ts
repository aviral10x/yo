/**
 * Shared domain constants — display labels, ordered pipeline stages, and the
 * standardized media "photo pack" checklist (IMPLEMENTATION_PLAN.md §5, §11).
 */

/** Ordered conversion pipeline (the wedge). Mirrors leadStageEnum. */
export const LEAD_STAGES = [
  { value: "new", label: "New enquiry" },
  { value: "qualified", label: "Qualified" },
  { value: "site_visit", label: "Site visit" },
  { value: "quoted", label: "Quoted" },
  { value: "hold", label: "Provisional hold" },
  { value: "deposit", label: "Deposit" },
  { value: "confirmed", label: "Confirmed" },
  { value: "lost", label: "Lost" },
] as const;

export const VENUE_TYPE_LABELS: Record<string, string> = {
  lawn: "Marriage Garden / Lawn",
  banquet: "Banquet Hall",
  resort: "Wedding Resort",
  farmhouse: "Wedding Farmhouse",
  hotel: "Hotel Venue",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "Wedding",
  reception: "Reception",
  sangeet: "Sangeet",
  mehndi: "Mehndi",
  haldi: "Haldi",
  engagement: "Engagement",
  birthday: "Birthday",
  corporate: "Corporate",
  other: "Other",
};

/**
 * The standardized photo-pack — one media checklist for every venue. Matches
 * mediaCategoryEnum and the Google Business Profile category guidance.
 */
export const MEDIA_PACK_CHECKLIST = [
  { category: "entrance", label: "Entrance / gate" },
  { category: "lawn_wide", label: "Lawn wide shot" },
  { category: "stage", label: "Stage / mandap setup" },
  { category: "buffet", label: "Buffet / catering setup" },
  { category: "bridal_room", label: "Bridal room" },
  { category: "guest_room", label: "Guest rooms (if any)" },
  { category: "parking", label: "Parking" },
  { category: "washroom", label: "Washrooms" },
  { category: "lighting", label: "Night lighting" },
  { category: "rain_backup", label: "Rain backup hall" },
  { category: "team", label: "Team photo" },
  { category: "live_event", label: "One live-event setup" },
] as const;

/**
 * Subdomain labels that must never be treated as a tenant venue slug. Used by
 * proxy.ts for host routing AND must be enforced at venue-slug creation (Phase 1)
 * so a tenant can never register one of these.
 */
export const RESERVED_SUBDOMAINS = new Set([
  "app",
  "www",
  "api",
  "admin",
  "dashboard",
  "mail",
  "smtp",
  "cdn",
  "static",
  "assets",
  "blog",
  "help",
  "support",
  "status",
  "billing",
]);

/** Lead sources we ingest, including marketplace imports. */
export const LEAD_SOURCE_LABELS: Record<string, string> = {
  direct: "Direct",
  whatsapp: "WhatsApp",
  wedmegood: "WedMeGood",
  weddingz: "Weddingz",
  venuelook: "VenueLook",
  walkin: "Walk-in",
  referral: "Referral",
  other: "Other",
};
