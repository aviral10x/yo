# VenuePilot — Implementation Plan

> **Working name:** VenuePilot _(top B2B option from the strategy doc; alternatives: Ceremoniq, VenueSutra, Riwaaz AI — pick after trademark + domain screening)._
>
> **One-line positioning:** _An owner operating system for wedding lawns and resorts that helps venues get discovered, convert more enquiries, collect deposits faster, and run every booking from first message to final event — in one place._
>
> **What this is:** "Owner.com for Indian wedding venues." A **venue-first growth OS**, not a couple-facing marketplace. The marketplace can come later, once we own structured inventory, pricing, availability, media, response and conversion data across hundreds of venues.
>
> **Build mode:** Founder-led (you + Claude Code), one opinionated stack, ship in phases.

---

## 0. Table of contents

1. [Product architecture at a glance](#1-product-architecture-at-a-glance)
2. [Tech stack](#2-tech-stack)
3. [System design & multi-tenancy](#3-system-design--multi-tenancy)
4. [Data model](#4-data-model)
5. [The four product layers → modules](#5-the-four-product-layers--modules)
6. [The conversion engine (the wedge)](#6-the-conversion-engine-the-wedge)
7. [The AI layer (Claude)](#7-the-ai-layer-claude)
8. [Integrations](#8-integrations)
9. [Commercial model in code](#9-commercial-model-in-code)
10. [GTM systems to build](#10-gtm-systems-to-build)
11. [Productization guardrails (built into the product)](#11-productization-guardrails-built-into-the-product)
12. [Repository structure](#12-repository-structure)
13. [Phased delivery roadmap](#13-phased-delivery-roadmap)
14. [Environments, infra & deployment](#14-environments-infra--deployment)
15. [Security, compliance & India specifics](#15-security-compliance--india-specifics)
16. [Startup programmes & infra credits](#16-startup-programmes--infra-credits)
17. [Success metrics to instrument](#17-success-metrics-to-instrument)
18. [Risks & mitigations](#18-risks--mitigations)
19. [Immediate next steps](#19-immediate-next-steps)

---

## 1. Product architecture at a glance

This is **one product with four "surfaces"** that all share a single database and codebase:

| Surface | Audience | Hostname pattern | Purpose |
|---|---|---|---|
| **Marketing site** | Venue owners (prospects) | `www.venuepilot.in` | Sell the product, host the audit tool, satisfy "public website + domain email" requirements for startup programmes |
| **Growth Audit tool** | Prospects (sales wedge) | `www.venuepilot.in/audit` | Free venue growth audit → lead gen for *us* (the Owner.com "grader" move) |
| **Owner dashboard** | Paying venue owners/staff | `app.venuepilot.in` | The actual SaaS: CRM, calendar, proposals, deposits, ops, AI, analytics |
| **Venue websites** | Couples (the venue's customers) | `{venue}.venuepilot.in` + custom domains | The high-conversion templated website each venue gets |

All four are served from a **single Next.js app** using host-based routing in middleware. This keeps velocity high; we can split into a monorepo later if a surface needs to scale independently.

The product is **multi-tenant**: a tenant is an **Organization** (a venue owner or venue group). One Organization owns one or more **Venues**. This maps directly to the three commercial plans (Starter = 1 venue, Growth = resort/farmhouse with rooms, Portfolio = multiple venues).

---

## 2. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + React 19 + TypeScript** | One app serves SSR venue sites (SEO matters for local search) *and* the dashboard. Server Components + Server Actions cut boilerplate. |
| Styling / UI | **Tailwind CSS + shadcn/ui** | Fast, consistent design system; shadcn gives us owned, themeable components — perfect for the "3–4 design systems only" discipline. |
| Database | **PostgreSQL** (managed: Neon or Supabase) | Relational data (venues → spaces → bookings → events) is the heart of this product. Start managed, move to AWS RDS/Cloud SQL once credits land. |
| ORM | **Drizzle ORM** | Type-safe, SQL-first, serverless-friendly. (Prisma is a fine alternative if you prefer its DX.) |
| Auth | **Clerk** | Built-in **Organizations + roles** (maps to multi-venue + team access), and **phone/OTP** login which matters a lot in India. (Auth.js is the zero-cost fallback.) |
| Payments | **Razorpay** | India-first. Two uses: (a) **Razorpay Subscriptions** for our SaaS billing, (b) **Payment Links / Orders** for venues to collect couple deposits. UPI/cards/netbanking. Razorpay **Route** enables split payments later. |
| Messaging | **WhatsApp Cloud API** (Meta) via a BSP (AiSensy / Interakt / Gupshup) | WhatsApp is *the* channel for Indian venue enquiries. Template messages for follow-ups + a shared inbox. |
| Media storage | **Cloudflare R2** (or S3) + image CDN | Photo "packs" are a core deliverable; media is heavy. R2 has no egress fees. |
| AI | **Claude API (Anthropic SDK)** | The whole intelligence layer. `claude-opus-4-8` for hard tasks, `claude-haiku-4-5` for cheap high-volume (drafts, tagging), Sonnet for the middle. Native bilingual EN/HI. |
| Background jobs | **Inngest** (or Trigger.dev) | AI workflows, follow-up reminders, scheduled drafts, calendar sync, audit generation — all event/cron driven. |
| Transactional email | **Resend** | Proposals, deposit receipts, review requests. |
| Product analytics | **PostHog** | Instrument the PMF metrics (§17) from day one. |
| Maps / places | **Google Maps Platform (Places API)** | Audit tool (profile completeness, reviews) + venue geodata. |
| Errors / monitoring | **Sentry** | App + background-job observability. |
| Hosting | **Vercel** initially | Best Next.js DX + multi-tenant domain handling out of the box. Migration path to AWS/GCP once credits land. |

---

## 3. System design & multi-tenancy

### Host-based routing (Next.js middleware)
`middleware.ts` inspects the request host and rewrites to the correct route group:

- `www.*` / apex → `app/(marketing)/...`
- `app.*` → `app/(dashboard)/...` (auth-gated)
- anything else (`{venue}.venuepilot.in` or a custom domain) → `app/(site)/[venue]/...`, resolving the tenant from the `Venue.slug` or `Venue.customDomain`.

This is the well-trodden Vercel "Platforms" multi-tenant pattern.

### Tenant isolation
- Every tenant-owned row carries `organizationId`.
- A single `withOrg()` data-access helper injects the current org from the Clerk session into **every** query — no raw queries in route handlers. This is our defence against cross-tenant leakage.
- Optionally enforce Postgres **Row-Level Security** later for defence-in-depth.

### Custom domains
- Venues on Growth/Portfolio can map their own domain (`venuename.com`). Handle via Vercel Domains API + a stored `customDomain` + verification record. Public venue sites must be fast and individually SEO-indexable (sitemap per tenant, per-venue metadata, JSON-LD `EventVenue`/`LocalBusiness` schema).

---

## 4. Data model

Core entities (Drizzle/Postgres). Names are stable; fields abbreviated.

```
Organization        id, name, plan (starter|growth|portfolio), billingCustomerId, createdAt
User                id, clerkId, name, phone, email, locale (en|hi)
Membership          orgId, userId, role (owner|manager|staff)

Venue               id, orgId, name, slug, customDomain, type (lawn|banquet|resort|farmhouse|hotel),
                    city, state, geo, story, amenities[], status, templateId, themeConfig(json)
Space               id, venueId, name, kind (lawn|hall|room_block|combo), seatedCap, floatingCap, notes
MediaAsset          id, venueId, url, kind (photo|video), aiTags[], category (entrance|stage|buffet|
                    bridal_room|guest_room|parking|lighting|rain_backup|team|live_event), width, height

Package             id, venueId, name, eventTypes[], inclusions(json), priceMin, priceMax, perPlate?, active
Lead                id, venueId, coupleName, phone, email, source (direct|whatsapp|wedmegood|weddingz|
                    venuelook|walkin|referral), eventType, dateRequested, datesFlexible(json), guestCount,
                    stage (new|qualified|site_visit|quoted|hold|deposit|confirmed|lost), score, ownerId
SiteVisit           id, leadId, scheduledAt, status, notes
Quote               id, leadId, packageId, lineItems(json), subtotal, taxes, total, validUntil, status
Booking             id, leadId, venueId, status (provisional|confirmed|cancelled), eventDate, spaceIds[]
CalendarBlock       id, venueId, spaceId, date, bookingId, kind (hold|confirmed|blackout)

Payment             id, bookingId, type (deposit|installment|final), amount, razorpayRef, status, dueDate, paidAt

Event               id, bookingId, checklist(json), timeline(json), menu(json), decorNotes,
                    roomingList(json), daySheetUrl
Vendor              id, venueId, name, category (photographer|caterer|decorator|other), contact, preferred
EventVendor         eventId, vendorId, role, notes

Review              id, venueId, author, rating, text, source (google|direct), response, respondedAt
Conversation        id, leadId, channel (whatsapp|email), ...
Message             id, conversationId, direction (in|out), body, aiDraft?, sentAt
WebsiteConfig       venueId, blocks(json), seoMeta(json), publishedAt   // content for the templated site

Subscription        orgId, plan, status, razorpaySubId, currentPeriodEnd, addons[]
AuditReport         id, prospectName, city, inputUrl, scores(json), mockPageUrl, sharedAt   // GTM wedge
ActivityEvent       orgId, venueId, type, payload, createdAt           // powers metrics (§17)
```

**The spine of the product** is the chain: `Lead → SiteVisit → Quote → Booking → Payment → Event`, anchored against `CalendarBlock` (availability) and `Space` (which areas fit which guest count). That chain *is* the conversion engine.

---

## 5. The four product layers → modules

Mapped to the strategy doc's four layers, with the phase each module lands in (see §13).

### Layer 1 — Discovery & Trust  _(Phase 1)_
- **Venue intake** → single standardized onboarding form (the productization rule).
- **Templated website builder**: 3–4 design systems only. Blocks: story, event types, capacity, lawn/hall combos, room inventory, package ranges, gallery, amenities, FAQ, site-visit booking, WhatsApp CTA, enquiry form, deposit CTA.
- **Google Business Profile toolkit**: completeness checklist + the category-correct **photo pack** spec (entrance, lawn wide, stage, buffet, bridal room, guest rooms, parking, washrooms, lighting, rain backup, team, one live-event set). "Photos represent reality, not AI-distorted" guidance baked into the uploader.
- **Review engine**: request reviews post-event, surface them on the site, draft responses (Layer 4).

### Layer 2 — Conversion  _(Phase 1 — the wedge)_
- **Inquiry CRM** with the pipeline stages above.
- **Availability calendar** + **space matching** + **package matching** → answers the five instant questions: _Is the date free? Which spaces are free? What guest count works? What package applies? What's the next step?_
- **Site-visit booking**, **quote/proposal**, **provisional hold**, **deposit collection**, **confirmation**.
- See §6 for the detailed state machine.

### Layer 3 — Operations  _(Phase 2)_
- **Package builder** + **room inventory** (Growth plan).
- **Event execution**: checklist, ceremony timeline, menu selections, décor notes, rooming list, payment schedule, **vendor tracking**, **day-sheet generation** (PDF).
- Kept deliberately simpler than hotel ERP.

### Layer 4 — Intelligence & AI  _(Phase 1 starter features → Phase 3 depth)_
- Phase 1: AI response drafts (WhatsApp/email, EN/HI), AI quote generation, AI website copy from intake, AI review-reply drafts, AI follow-up reminders.
- Phase 2: AI caption/reel prompts from the media library, **AI media tagging** ("mandap", "night lighting", "rain backup hall").
- Phase 3: price recommendations, date-demand heat maps, enquiry scoring (needs accumulated data).

---

## 6. The conversion engine (the wedge)

Implement the lead lifecycle as an explicit state machine:

```
new → qualified → site_visit → quoted → hold → deposit → confirmed
                                                   ↘ lost (at any stage, with reason)
```

**Availability resolution** (the core query behind "is the date free?"):
- Given `(venueId, date, guestCount, eventType)` → return free `Space`s whose capacity ≥ guestCount, that have no `CalendarBlock` conflict (hold or confirmed), plus the matching `Package`(s) and price range.
- A **provisional hold** writes a `CalendarBlock(kind=hold)` with a TTL; an Inngest job auto-releases expired holds and nudges the owner.
- **Deposit** creates a Razorpay Payment Link; on webhook `paid`, the hold becomes `confirmed`, the calendar block flips, and an `Event` record is created.

Every transition emits an `ActivityEvent` so the metrics in §17 come for free.

---

## 7. The AI layer (Claude)

A single internal `ai/` module wraps the Anthropic SDK. Principles:

- **Framed as "reduced missed business," not novelty.** Every feature shortens response time or raises conversion.
- **Model tiering for cost:** `claude-haiku-4-5` for high-volume drafts/tagging, `claude-sonnet-4-6` for quotes/copy, `claude-opus-4-8` for the hardest reasoning (e.g. audit synthesis). Make the model a config per feature.
- **Bilingual by default:** detect/respect `User.locale`; generate EN or HI (and Hinglish) drafts.
- **Grounded prompts:** AI quotes/drafts are built from real venue context (packages, capacities, prices, past messages) passed in as structured context — not free-floating generation. This keeps outputs accurate and is the seed of the data moat.
- **Human-in-the-loop:** AI produces *drafts*; the owner approves/edits before send. Lowers risk, builds trust, and creates accept/reject signal we can learn from.

Feature → model map (initial):

| Feature | Model | Trigger |
|---|---|---|
| WhatsApp/email reply draft (EN/HI) | Haiku | New inbound message |
| Quote draft from event type + guest count | Sonnet | Owner clicks "Draft quote" |
| Website copy from intake form | Sonnet | Onboarding |
| Review-reply draft | Haiku | New review |
| Caption / reel prompt from photos | Haiku | Content studio |
| Media auto-tagging (vision) | Haiku/Sonnet vision | Photo upload |
| Follow-up reminder copy | Haiku | Inngest schedule |
| Audit report synthesis | Sonnet/Opus | Prospect audit run |

Run AI calls inside Inngest functions where latency/retries matter; stream responses in the UI where the owner is waiting.

---

## 8. Integrations

| Integration | Scope | Notes |
|---|---|---|
| **Razorpay** | SaaS subscriptions + couple deposit collection | Verify all webhooks (signature). Idempotent handlers. Store `razorpayRef` on `Payment`/`Subscription`. KYC needed for live mode. |
| **WhatsApp Cloud API** (via BSP) | Inbound lead capture, template follow-ups, shared inbox | Requires approved message templates + opt-in. Start with a BSP (AiSensy/Interakt) to skip Meta onboarding friction. |
| **Google Business Profile / Places** | Audit tool + profile toolkit | Places API for completeness/reviews scoring in the audit. Full GBP API write-access requires Google approval — start read-only/checklist, automate later. |
| **Cloudflare R2 / S3** | Media uploads, day-sheet PDFs, mock audit pages | Signed upload URLs; image transforms via CDN. |
| **Resend** | Transactional email | Proposals, deposit receipts, review requests. |
| **Marketplace lead import** | Centralize WedMeGood/Weddingz/VenueLook leads | Build as a *feature* (forward-to-email parsing + manual paste + later API) — not a dependency. Helps owners convert existing leads faster. |

---

## 9. Commercial model in code

Three plans, gated by a central **entitlements** map (not scattered `if` checks):

- **Starter** (single lawn/banquet): website, lead capture, calendar, proposals, deposits, GBP pack, review engine, WhatsApp templates.
- **Growth** (resorts/farmhouses): + room inventory, package builder, event sheets, vendor tracking, content studio, better analytics.
- **Portfolio** (multi-venue): + multi-property dashboard, shared team inbox, role access, central reporting, bulk content/profile management.

Billing structure: **one-time onboarding fee + monthly subscription + pass-through platform costs** (WhatsApp/API, ad spend, photo shoots sit *outside* the recurring price so the core stays recognisably software). Implement add-ons as separate Razorpay line items / invoices.

```ts
// entitlements.ts — single source of truth
const PLAN_FEATURES = {
  starter:   ['website','crm','calendar','proposals','deposits','gbp_pack','reviews','wa_templates'],
  growth:    [...starter, 'room_inventory','package_builder','event_sheets','vendors','content_studio','analytics'],
  portfolio: [...growth, 'multi_property','team_inbox','roles','central_reporting','bulk_ops'],
}
```

---

## 10. GTM systems to build

The product must ship with the tools that win the first 25 venues (founder-led sales, not paid ads).

1. **Venue Growth Audit generator** _(build EARLY — Phase 1 parallel track)_. Modeled on Owner's restaurant grader. Input a venue (name/URL/Maps link) → output a short report scoring: Google profile completeness, photo quality, review count & response rate, package visibility, site-visit CTA, date-check flow, Instagram activity, enquiry flow. Then render a **mock upgraded page** + a sample enquiry flowing through our system. This is the #1 sales asset.
2. **Founding-cohort onboarding flow**: the two-week launch process, productized.
3. **Owner metrics dashboard**: surfaces the PMF metrics (§17) back to the owner — proof the product works → retention + referrals.
4. **Target-list tooling** (internal): scrape/organize 250–300 venues per geographic cluster from Maps/WedMeGood/Weddingz/VenueLook into a CRM for our own outbound.

**Beachhead:** Rajasthan destination cluster (Jaipur–Udaipur–Jodhpur) for premium proof, *or* one NCR-adjacent / state-capital cluster for high-volume local inventory. Pick one; stay until repeatable.

---

## 11. Productization guardrails (built into the product)

Encode the discipline so the business can't drift into an agency:

- **3–4 design systems only** → enforced by a fixed `templateId` enum.
- **One standard onboarding form** for every venue.
- **One media checklist** (the photo pack).
- **One two-week launch process** (a built-in onboarding checklist).
- **No bespoke code for the first 50 customers** → everything is config/templates.
- **No done-for-you social** beyond AI-assisted generation + scheduling.
- **No custom reporting** unless it graduates into the product.

---

## 12. Repository structure

Single Next.js app, module-organized (introduce Turborepo only if a surface must scale separately):

```
yo/
├─ app/
│  ├─ (marketing)/            # www — public marketing + /audit wedge
│  ├─ (dashboard)/            # app.* — owner SaaS (auth-gated)
│  │   ├─ leads/  calendar/  proposals/  events/  media/  reviews/
│  │   ├─ analytics/  settings/  billing/
│  ├─ (site)/[venue]/         # {venue}.* — public templated venue websites
│  └─ api/                    # webhooks (razorpay, whatsapp), cron, uploads
├─ middleware.ts              # host-based tenant routing
├─ lib/
│  ├─ db/ (drizzle schema + client)   auth/   entitlements.ts
│  ├─ ai/ (claude wrappers, prompts)  payments/ (razorpay)
│  ├─ whatsapp/   google/   storage/   email/   availability/
├─ components/ (shadcn/ui + shared)
├─ templates/                 # the 3–4 venue website design systems
├─ inngest/                   # background jobs (follow-ups, holds, audits)
├─ emails/                    # react-email templates
└─ IMPLEMENTATION_PLAN.md
```

---

## 13. Phased delivery roadmap

Timeboxes assume founder + Claude Code, roughly full-time. Adjust freely.

### Phase 0 — Foundation _(Week 1–2)_
- Scaffold Next.js + TS + Tailwind + shadcn; Vercel deploy pipeline; envs.
- Clerk auth with **Organizations + roles**; `withOrg()` data layer.
- Drizzle schema (core entities, §4) + migrations; Neon/Supabase Postgres.
- Host-based routing middleware (marketing / app / venue site).
- Sentry + PostHog wired.
- **Buy domain, set up domain email** → unlocks startup-programme applications (§16).

### Phase 1 — MVP _(Week 3–10)_
The strategy doc's exact MVP + the audit wedge:
- Venue intake + **templated website** (2–3 templates) → publish to subdomain.
- **Inquiry CRM** + pipeline + **availability calendar** + space/package matching.
- **Site-visit booking** + **quote/proposal** + **provisional hold** + **Razorpay deposit** + confirmation.
- **GBP toolkit** (checklist + photo pack uploader).
- **Review engine** (request + display + AI reply drafts).
- **Simple event sheet**.
- **AI response assistant** (WhatsApp/email drafts EN/HI) + AI quote draft + AI website copy.
- **WhatsApp** inbound capture + template follow-ups.
- **Growth Audit tool** live on the marketing site (parallel track — it gets you customers).
- SaaS billing (Razorpay Subscriptions) + entitlements + 3 plans.
- **Goal:** onboard the founding cohort.

### Phase 2 — Operations depth _(Week 11–16)_
- Package builder + room inventory (Growth plan).
- Full event execution: checklist, timeline, menu, décor, rooming list, payment schedule, vendor tracking, **day-sheet PDF**.
- **Content studio**: AI captions/reel prompts + **AI media tagging**.
- Owner analytics dashboard (PMF metrics).

### Phase 3 — Intelligence _(Week 17–22)_
- Price recommendations, date-demand heat maps, **enquiry scoring** (uses accumulated data).
- **Portfolio plan**: multi-property dashboard, shared team inbox, roles, central reporting, bulk ops.

### Phase 4 — Marketplace foundation _(later)_
- Marketplace lead import maturity → eventually a couple-facing marketplace **once we own structured inventory + conversion data** across hundreds of venues.

---

## 14. Environments, infra & deployment

- **Environments:** `local` → `preview` (Vercel per-PR) → `production`.
- **Secrets:** Vercel env vars / a secrets manager; never in repo. `.env.example` checked in.
- **DB migrations:** Drizzle Kit, run in CI on deploy.
- **CI:** typecheck + lint + build on every PR (GitHub Actions).
- **Webhooks:** Razorpay + WhatsApp endpoints with signature verification + idempotency keys.
- **Backups:** managed Postgres PITR; periodic R2 media backup.
- **Credits migration path:** start on Vercel + Neon for velocity; move compute/DB to AWS or GCP once Activate / Google for Startups credits are approved (§16).

---

## 15. Security, compliance & India specifics

- **Multi-tenant isolation:** mandatory `organizationId` scoping via `withOrg()`; consider Postgres RLS later.
- **Payments:** never touch raw card data — Razorpay is PCI-compliant; we store only references. Live mode needs business KYC.
- **DPDP Act 2023 (India):** collect consent for couple/lead PII, support data deletion, document a privacy policy. Build a consent flag on `Lead`.
- **WhatsApp policy:** explicit opt-in before template messaging; respect 24-hour session window rules.
- **Auth:** Clerk handles sessions/MFA; enforce role checks server-side, not just in UI.
- **Media:** signed upload URLs, content-type validation, size limits.
- **GST/invoicing:** generate compliant invoices for subscriptions + onboarding fees.

---

## 16. Startup programmes & infra credits

These directly affect setup order — **two are blocking prerequisites worth doing in Phase 0**:

1. **DPIIT / Startup India recognition** — do early; other programmes ask for it.
2. **Public company website + matching domain email** — required by Google for Startups Cloud and others; that's why the marketing site + domain email is a Phase 0 task.

Then apply (verify current terms before relying on numbers):
- **Google for Startups Cloud** — up to $200k (up to **$350k for AI startups**) GCP credits.
- **AWS Activate** — up to $200k credits (good fit if using Bedrock/Nova/infra).
- **Microsoft for Startups** — up to $150k Azure credits.
- **NVIDIA Inception** — free; useful when we add vision/media workloads.
- **MeitY SAMRIDH**, **IndiaAI Startup Financing & Compute**, **Google for Startups Accelerator: AI First India** (register interest), **MeitY Startup Hub**.

---

## 17. Success metrics to instrument

Wire these into PostHog/`ActivityEvent` from day one — they define PMF and feed both the owner dashboard and our sales proof:

- **Time to first response** (enquiry → first reply).
- **Lead → site-visit rate.**
- **Site-visit → deposit rate.**
- **Direct lead share** (direct vs marketplace-sourced).
- **Review growth** (count + response rate).
- **Dates confidently quoted** without manual back-and-forth.
- (Business) MRR, onboarding-fee revenue, plan mix, churn, audit→demo→close funnel.

---

## 18. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Drifting into an agency / bespoke work | Hard guardrails in §11; no custom code for first 50 customers. |
| WhatsApp/Google API approval friction | Start via BSP + read-only checklists; automate writes after approval. |
| AI accuracy on quotes/replies | Grounded prompts + human-in-the-loop approval; never auto-send money/quotes. |
| Multi-tenant data leakage | Centralized `withOrg()` + (later) RLS; tenant-isolation tests. |
| Low owner tech-literacy / adoption | Two-week productized onboarding; AI does the heavy lifting; WhatsApp-first UX. |
| Cloud cost before credits land | Start cheap (Vercel/Neon/Haiku); apply for credits in Phase 0. |
| Seasonality of wedding demand | Land owners off-season for setup; use audit wedge year-round. |

---

## 19. Immediate next steps

When you say go, I'll execute Phase 0 in this order:

1. **Decide & screen the name** (VenuePilot vs alternatives) → buy domain → set up domain email.
2. **Scaffold** the Next.js + TS + Tailwind + shadcn app in this repo; first Vercel deploy.
3. **Wire** Clerk (orgs + roles) + Drizzle schema (core entities) + Neon Postgres + middleware tenant routing.
4. **Stub** the four surfaces (marketing, app, venue site, audit) with placeholder pages so the routing is provably working.
5. **Apply** for DPIIT recognition + Google for Startups Cloud (needs the public site from step 1).

Then we move into Phase 1, starting with the **CRM + availability engine** (the wedge) and the **Growth Audit tool** (the customer magnet) in parallel.

---

_Sources: derived from the strategy document "Strategy for an Owner Style Wedding Venue Platform in India" (market data from IBEF, WedMeGood 2024–26 reports; product analogues Owner.com, Tripleseat, Event Temple, Cvent, Spacestack, Moposa, Sonas; Indian incumbents WedMeGood, Weddingz, VenueLook; programme details from Google/AWS/Microsoft/NVIDIA/Startup India/MeitY/IndiaAI). Verify all third-party figures, pricing, and programme terms before relying on them._
