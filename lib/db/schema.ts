/**
 * VenuePilot database schema (Drizzle ORM + Postgres/Neon).
 *
 * Multi-tenant model: a tenant is an `organizations` row (a venue owner or
 * venue group). Every tenant-owned table carries `organizationId` so the
 * `withOrg()` data layer (Phase 1) can scope every query — and every such
 * column is indexed because it is filtered on every request. Column names are
 * written in camelCase and mapped to snake_case via `casing: 'snake_case'`.
 *
 * See IMPLEMENTATION_PLAN.md §4 for the conceptual model.
 */
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const planEnum = pgEnum("plan", ["starter", "growth", "portfolio"]);
export const localeEnum = pgEnum("locale", ["en", "hi"]);
export const roleEnum = pgEnum("role", ["owner", "manager", "staff"]);
export const venueTypeEnum = pgEnum("venue_type", [
  "lawn",
  "banquet",
  "resort",
  "farmhouse",
  "hotel",
]);
export const venueStatusEnum = pgEnum("venue_status", [
  "draft",
  "published",
  "archived",
]);
export const spaceKindEnum = pgEnum("space_kind", [
  "lawn",
  "hall",
  "room_block",
  "combo",
]);
export const mediaKindEnum = pgEnum("media_kind", ["photo", "video"]);
export const mediaCategoryEnum = pgEnum("media_category", [
  "entrance",
  "lawn_wide",
  "stage",
  "buffet",
  "bridal_room",
  "guest_room",
  "parking",
  "washroom",
  "lighting",
  "rain_backup",
  "team",
  "live_event",
  "other",
]);
export const eventTypeEnum = pgEnum("event_type", [
  "wedding",
  "reception",
  "sangeet",
  "mehndi",
  "haldi",
  "engagement",
  "birthday",
  "corporate",
  "other",
]);
export const leadSourceEnum = pgEnum("lead_source", [
  "direct",
  "whatsapp",
  "wedmegood",
  "weddingz",
  "venuelook",
  "walkin",
  "referral",
  "other",
]);
export const leadStageEnum = pgEnum("lead_stage", [
  "new",
  "qualified",
  "site_visit",
  "quoted",
  "hold",
  "deposit",
  "confirmed",
  "lost",
]);
export const siteVisitStatusEnum = pgEnum("site_visit_status", [
  "scheduled",
  "completed",
  "no_show",
  "cancelled",
]);
export const quoteStatusEnum = pgEnum("quote_status", [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "provisional",
  "confirmed",
  "cancelled",
]);
export const calendarBlockKindEnum = pgEnum("calendar_block_kind", [
  "hold",
  "confirmed",
  "blackout",
]);
export const paymentTypeEnum = pgEnum("payment_type", [
  "deposit",
  "installment",
  "final",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);
export const vendorCategoryEnum = pgEnum("vendor_category", [
  "photographer",
  "caterer",
  "decorator",
  "makeup",
  "music",
  "other",
]);
export const reviewSourceEnum = pgEnum("review_source", ["google", "direct"]);
export const conversationChannelEnum = pgEnum("conversation_channel", [
  "whatsapp",
  "email",
]);
export const messageDirectionEnum = pgEnum("message_direction", ["in", "out"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "cancelled",
  "paused",
]);

// Reusable timestamp columns.
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
};

// ---------------------------------------------------------------------------
// Tenancy: organizations, users, memberships
// ---------------------------------------------------------------------------
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkOrgId: text("clerk_org_id").unique(),
  name: text("name").notNull(),
  plan: planEnum("plan").notNull().default("starter"),
  billingCustomerId: text("billing_customer_id"),
  ...timestamps,
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").unique(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  locale: localeEnum("locale").notNull().default("en"),
  ...timestamps,
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("staff"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("memberships_org_user_uq").on(t.organizationId, t.userId),
    index("memberships_user_idx").on(t.userId),
  ],
);

// ---------------------------------------------------------------------------
// Venues, spaces, media, packages, website config
// ---------------------------------------------------------------------------
export const venues = pgTable(
  "venues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    customDomain: text("custom_domain").unique(),
    type: venueTypeEnum("type").notNull().default("lawn"),
    status: venueStatusEnum("status").notNull().default("draft"),
    city: text("city"),
    state: text("state"),
    addressLine: text("address_line"),
    lat: numeric("lat"),
    lng: numeric("lng"),
    googlePlaceId: text("google_place_id"),
    story: text("story"),
    amenities: jsonb("amenities").$type<string[]>().default([]),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("venues_slug_uq").on(t.slug),
    index("venues_org_idx").on(t.organizationId),
  ],
);

export const spaces = pgTable(
  "spaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: spaceKindEnum("kind").notNull().default("lawn"),
    seatedCapacity: integer("seated_capacity"),
    floatingCapacity: integer("floating_capacity"),
    roomCount: integer("room_count"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("spaces_org_idx").on(t.organizationId),
    index("spaces_venue_idx").on(t.venueId),
  ],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    kind: mediaKindEnum("kind").notNull().default("photo"),
    category: mediaCategoryEnum("category").notNull().default("other"),
    aiTags: jsonb("ai_tags").$type<string[]>().default([]),
    width: integer("width"),
    height: integer("height"),
    altText: text("alt_text"),
    sortOrder: integer("sort_order").default(0),
    ...timestamps,
  },
  (t) => [
    index("media_org_idx").on(t.organizationId),
    index("media_venue_idx").on(t.venueId),
  ],
);

export const packages = pgTable(
  "packages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    eventTypes: jsonb("event_types").$type<string[]>().default([]),
    inclusions: jsonb("inclusions").$type<string[]>().default([]),
    priceMin: numeric("price_min"),
    priceMax: numeric("price_max"),
    perPlate: numeric("per_plate"),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index("packages_org_idx").on(t.organizationId),
    index("packages_venue_idx").on(t.venueId),
  ],
);

export const websiteConfigs = pgTable(
  "website_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .unique()
      .references(() => venues.id, { onDelete: "cascade" }),
    templateId: text("template_id").notNull().default("classic"),
    themeConfig: jsonb("theme_config")
      .$type<Record<string, unknown>>()
      .default({}),
    blocks: jsonb("blocks").$type<Record<string, unknown>>().default({}),
    seoMeta: jsonb("seo_meta").$type<Record<string, unknown>>().default({}),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("website_configs_org_idx").on(t.organizationId)],
);

// ---------------------------------------------------------------------------
// Conversion spine: leads -> site visits -> quotes -> bookings -> payments
// ---------------------------------------------------------------------------
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    coupleName: text("couple_name"),
    phone: text("phone"),
    email: text("email"),
    source: leadSourceEnum("source").notNull().default("direct"),
    eventType: eventTypeEnum("event_type").default("wedding"),
    dateRequested: date("date_requested"),
    datesFlexible: jsonb("dates_flexible").$type<string[]>().default([]),
    guestCount: integer("guest_count"),
    stage: leadStageEnum("stage").notNull().default("new"),
    lostReason: text("lost_reason"),
    score: integer("score"),
    assignedUserId: uuid("assigned_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    consentAt: timestamp("consent_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("leads_org_idx").on(t.organizationId),
    index("leads_venue_idx").on(t.venueId),
    index("leads_org_stage_idx").on(t.organizationId, t.stage),
  ],
);

export const siteVisits = pgTable(
  "site_visits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    status: siteVisitStatusEnum("status").notNull().default("scheduled"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("site_visits_org_idx").on(t.organizationId),
    index("site_visits_lead_idx").on(t.leadId),
  ],
);

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    packageId: uuid("package_id").references(() => packages.id, {
      onDelete: "set null",
    }),
    lineItems: jsonb("line_items")
      .$type<{ label: string; qty: number; unitPrice: number }[]>()
      .default([]),
    subtotal: numeric("subtotal"),
    taxes: numeric("taxes"),
    total: numeric("total"),
    validUntil: date("valid_until"),
    status: quoteStatusEnum("status").notNull().default("draft"),
    ...timestamps,
  },
  (t) => [
    index("quotes_org_idx").on(t.organizationId),
    index("quotes_lead_idx").on(t.leadId),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    status: bookingStatusEnum("status").notNull().default("provisional"),
    eventType: eventTypeEnum("event_type").default("wedding"),
    eventDate: date("event_date").notNull(),
    // NOTE: calendar_blocks is the source of truth for occupied spaces; this
    // jsonb mirror is convenience only. Phase 1 may add a booking_spaces join.
    spaceIds: jsonb("space_ids").$type<string[]>().default([]),
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("bookings_org_idx").on(t.organizationId),
    index("bookings_venue_idx").on(t.venueId),
    index("bookings_org_date_idx").on(t.organizationId, t.eventDate),
  ],
);

export const calendarBlocks = pgTable(
  "calendar_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    kind: calendarBlockKindEnum("kind").notNull().default("hold"),
    // Cancelling a booking keeps the row (status='cancelled'); app code must
    // release/flip the block. Cascade only fires on a hard booking delete.
    bookingId: uuid("booking_id").references(() => bookings.id, {
      onDelete: "cascade",
    }),
    ...timestamps,
  },
  (t) => [
    // One block per space per day prevents double-booking at the DB level.
    uniqueIndex("calendar_space_date_uq").on(t.spaceId, t.date),
    index("calendar_org_idx").on(t.organizationId),
    index("calendar_venue_date_idx").on(t.venueId, t.date),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // restrict: payments are a financial/audit trail — never cascade-delete them
    // when a booking is removed.
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    type: paymentTypeEnum("type").notNull().default("deposit"),
    amount: numeric("amount").notNull(),
    currency: text("currency").notNull().default("INR"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    razorpayPaymentLinkId: text("razorpay_payment_link_id"),
    razorpayPaymentId: text("razorpay_payment_id"),
    dueDate: date("due_date"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("payments_org_idx").on(t.organizationId),
    index("payments_booking_idx").on(t.bookingId),
  ],
);

// ---------------------------------------------------------------------------
// Operations: events, vendors, reviews, conversations
// ---------------------------------------------------------------------------
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    bookingId: uuid("booking_id")
      .notNull()
      .unique()
      .references(() => bookings.id, { onDelete: "cascade" }),
    checklist: jsonb("checklist")
      .$type<{ label: string; done: boolean }[]>()
      .default([]),
    timeline: jsonb("timeline")
      .$type<{ time: string; item: string }[]>()
      .default([]),
    menu: jsonb("menu").$type<Record<string, unknown>>().default({}),
    decorNotes: text("decor_notes"),
    roomingList: jsonb("rooming_list")
      .$type<Record<string, unknown>>()
      .default({}),
    daySheetUrl: text("day_sheet_url"),
    ...timestamps,
  },
  (t) => [index("events_org_idx").on(t.organizationId)],
);

export const vendors = pgTable(
  "vendors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: vendorCategoryEnum("category").notNull().default("other"),
    contact: text("contact"),
    preferred: boolean("preferred").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index("vendors_org_idx").on(t.organizationId),
    index("vendors_venue_idx").on(t.venueId),
  ],
);

export const eventVendors = pgTable(
  "event_vendors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    role: text("role"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("event_vendor_uq").on(t.eventId, t.vendorId),
    index("event_vendors_org_idx").on(t.organizationId),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    author: text("author"),
    rating: integer("rating"),
    text: text("text"),
    source: reviewSourceEnum("source").notNull().default("direct"),
    response: text("response"),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("reviews_org_idx").on(t.organizationId),
    index("reviews_venue_idx").on(t.venueId),
  ],
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }),
    channel: conversationChannelEnum("channel").notNull().default("whatsapp"),
    externalId: text("external_id"),
    ...timestamps,
  },
  (t) => [
    index("conversations_org_idx").on(t.organizationId),
    index("conversations_lead_idx").on(t.leadId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    direction: messageDirectionEnum("direction").notNull(),
    body: text("body"),
    aiDraft: text("ai_draft"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("messages_org_idx").on(t.organizationId),
    index("messages_conversation_idx").on(t.conversationId, t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// Billing + GTM + analytics
// ---------------------------------------------------------------------------
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .unique()
    .references(() => organizations.id, { onDelete: "cascade" }),
  plan: planEnum("plan").notNull().default("starter"),
  status: subscriptionStatusEnum("status").notNull().default("trialing"),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  addons: jsonb("addons").$type<string[]>().default([]),
  ...timestamps,
});

// Lead-gen wedge: the public venue growth audit (not tenant-scoped).
export const auditReports = pgTable("audit_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  prospectName: text("prospect_name"),
  city: text("city"),
  inputUrl: text("input_url"),
  contactPhone: text("contact_phone"),
  scores: jsonb("scores").$type<Record<string, unknown>>().default({}),
  mockPageUrl: text("mock_page_url"),
  sharedAt: timestamp("shared_at", { withTimezone: true }),
  ...timestamps,
});

// Append-only event stream powering the PMF metrics (IMPLEMENTATION_PLAN §17).
export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    venueId: uuid("venue_id").references(() => venues.id, {
      onDelete: "cascade",
    }),
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("activity_org_created_idx").on(t.organizationId, t.createdAt),
    index("activity_venue_idx").on(t.venueId),
  ],
);

// ---------------------------------------------------------------------------
// Relations (for the relational query builder)
// ---------------------------------------------------------------------------
export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  venues: many(venues),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
}));

export const venuesRelations = relations(venues, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [venues.organizationId],
    references: [organizations.id],
  }),
  spaces: many(spaces),
  media: many(mediaAssets),
  packages: many(packages),
  leads: many(leads),
  websiteConfig: one(websiteConfigs),
}));

export const spacesRelations = relations(spaces, ({ one }) => ({
  venue: one(venues, { fields: [spaces.venueId], references: [venues.id] }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  venue: one(venues, { fields: [leads.venueId], references: [venues.id] }),
  siteVisits: many(siteVisits),
  quotes: many(quotes),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  venue: one(venues, { fields: [bookings.venueId], references: [venues.id] }),
  lead: one(leads, { fields: [bookings.leadId], references: [leads.id] }),
  payments: many(payments),
  event: one(events),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  booking: one(bookings, {
    fields: [events.bookingId],
    references: [bookings.id],
  }),
  vendors: many(eventVendors),
}));
