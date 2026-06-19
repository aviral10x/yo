# VenuePilot _(working name)_

An **owner operating system for wedding lawns and resorts** in India — "Owner.com for Indian wedding venues." A venue-first growth OS that helps venues get discovered, convert more enquiries, collect deposits faster, and run every booking from first message to final event in one place.

> Venue-first growth OS — **not** a couple-facing marketplace. The marketplace comes later, once we own structured inventory, availability, media, and conversion data across hundreds of venues.

## Status

**Phase 0 (foundation) complete** — scaffold, multi-tenant routing, auth, full DB schema, design system, and integration wiring are in place and verified (build + typecheck + lint pass; all routes verified at runtime). See **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** for the full architecture, data model, and phased roadmap. Phase 1 builds the CRM + availability engine + growth-audit tool.

## Run locally

```bash
pnpm install
cp .env.example .env.local   # fill in keys as you connect each service
pnpm dev                     # http://localhost:3000
```

The app is **multi-tenant by hostname**. Browsers resolve `*.localhost` to loopback automatically, so:

| URL | Surface |
|---|---|
| `http://localhost:3000` | Marketing site |
| `http://localhost:3000/audit` | Growth-audit tool (the sales wedge) |
| `http://app.localhost:3000` | Owner dashboard |
| `http://anyvenue.localhost:3000` | A tenant venue website |

Everything degrades gracefully without third-party keys (the dashboard shows a "Clerk not configured" badge; DB / Razorpay / AI / analytics no-op until configured). Set `NEXT_PUBLIC_ROOT_DOMAIN` for production hosts.

Scripts: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm db:generate` / `db:push` / `db:migrate` / `db:studio`.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 + shadcn/ui · PostgreSQL + Drizzle · Clerk · Razorpay · WhatsApp Cloud API · Claude (Anthropic) · Inngest · PostHog · Sentry · deployed on Vercel.

## The four product layers

1. **Discovery & trust** — templated high-conversion venue websites + Google Business Profile toolkit + photo packs.
2. **Conversion (the wedge)** — inquiry CRM, availability calendar, site-visit booking, quote → hold → deposit → confirmation.
3. **Operations** — event checklist, timeline, menu, décor, rooming list, vendor tracking, day-sheet generation.
4. **Intelligence & AI** — bilingual (EN/HI) reply drafts, AI quotes, website copy, review replies, media tagging, follow-ups.

## Commercial model

Three plans — **Starter** (single lawn/banquet), **Growth** (resorts/farmhouses), **Portfolio** (multi-venue) — sold as one-time onboarding + monthly subscription + pass-through platform costs.
