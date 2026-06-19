import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CreditCard,
  Globe,
  LineChart,
  MessageSquare,
  Sparkles,
  Star,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PLAN_META, type Plan } from "@/lib/plans";
import { appUrl } from "@/lib/urls";

const STATS = [
  { value: "₹4.74L cr", label: "Indian wedding-season spend" },
  { value: "10M+", label: "weddings every year" },
  { value: "38%", label: "of venue frustrations are about availability" },
  { value: "1 in 3", label: "couples check reviews before booking" },
];

const FEATURES = [
  {
    icon: Globe,
    title: "A venue website that converts",
    body: "A high-conversion, templated site with your story, spaces, packages, gallery and enquiry CTAs — plus a Google Business Profile toolkit.",
  },
  {
    icon: CalendarCheck,
    title: "Instant availability & holds",
    body: "Let couples check if their date is free in seconds, match the right space and package, and place a provisional hold — the #1 booking blocker, solved.",
  },
  {
    icon: CreditCard,
    title: "Collect deposits faster",
    body: "Send a deposit link over WhatsApp and confirm bookings the moment it's paid. UPI, cards, and netbanking via Razorpay.",
  },
  {
    icon: MessageSquare,
    title: "AI replies in English & Hindi",
    body: "Draft instant, on-brand responses to every WhatsApp and email enquiry, generate quotes, and never let a lead go cold.",
  },
  {
    icon: Star,
    title: "Reviews & reputation",
    body: "Request reviews after every event, surface them on your site, and draft replies — so you look as premium as the big brands.",
  },
  {
    icon: LineChart,
    title: "Proof it's working",
    body: "Track response time, lead-to-visit, visit-to-deposit and direct-lead share — the numbers that show you're winning more dates.",
  },
];

const FAQ = [
  {
    q: "Is this a marketplace like WedMeGood?",
    a: "No. VenuePilot is your own growth and operations system — your website, your leads, your data. Marketplaces send you leads; we help you convert and own them.",
  },
  {
    q: "Do I have to leave the platforms I already use?",
    a: "Not at all. Keep receiving leads from WedMeGood, Weddingz or VenueLook — VenuePilot helps you centralize and convert them faster, all in one inbox.",
  },
  {
    q: "How long does onboarding take?",
    a: "A productized two-week launch: one intake form, one media checklist, and your site, calendar, deposits and AI assistant go live.",
  },
  {
    q: "Does the AI cost extra?",
    a: "AI replies, quotes and the growth audit are built in. Heavy add-ons like ad-spend management or professional shoots are optional and priced separately.",
  },
];

export default function MarketingHome() {
  const plans = Object.entries(PLAN_META) as [Plan, (typeof PLAN_META)[Plan]][];

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid text-border/60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div>
            <Badge variant="secondary" className="mb-5 gap-1.5">
              <Sparkles className="size-3.5 text-primary" /> AI-first OS for wedding venues
            </Badge>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Fill more dates.
              <br />
              <span className="text-primary">Win every booking.</span>
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
              VenuePilot helps wedding lawns and resorts get discovered, convert
              more enquiries, collect deposits faster, and run every booking from
              first message to final event — in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/audit">
                  Get a free AI audit <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={`${appUrl}/sign-up`}>Start free</a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              The same tech as the big brands — built for independent venues.
            </p>
          </div>
          <HeroMockup />
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-semibold tracking-tight text-primary">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to win more bookings
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Four connected layers — discovery, conversion, operations, and AI —
            replace your patchwork of website builders, spreadsheets and chats.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="border-border/70 transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* AI section */}
      <section id="about" className="relative overflow-hidden bg-emerald-950 text-emerald-50">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-2">
          <div>
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/20">
              Powered by AI
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              AI that turns enquiries into booked dates
            </h2>
            <p className="mt-4 text-pretty text-emerald-100/80">
              Every enquiry gets an instant, on-brand draft reply in English or
              Hindi. Quotes generate themselves. Reviews get answered. And our
              free growth audit shows any venue exactly what to fix — running on
              Claude, deployable on cloud AI (incl. AWS Bedrock).
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/audit">
                  Try the AI audit <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["English & Hindi replies", "Drafted in your voice, ready to send."],
              ["Instant quote generation", "From event type and guest count."],
              ["Review reply drafts", "Stay responsive without the effort."],
              ["Media auto-tagging", "Find ‘mandap’ or ‘night lighting’ instantly."],
            ].map(([t, b]) => (
              <div
                key={t}
                className="rounded-xl border border-emerald-400/20 bg-emerald-900/40 p-4"
              >
                <p className="font-medium">{t}</p>
                <p className="mt-1 text-sm text-emerald-100/70">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Plans for every kind of venue
          </h2>
          <p className="mt-3 text-muted-foreground">
            One-time onboarding + monthly subscription. No lock-in.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map(([key, meta]) => {
            const featured = key === "growth";
            return (
              <Card
                key={key}
                className={cn(
                  "relative flex flex-col",
                  featured && "border-primary shadow-lg ring-1 ring-primary/20",
                )}
              >
                {featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most popular
                  </span>
                )}
                <CardContent className="flex flex-1 flex-col gap-5 pt-7">
                  <div>
                    <h3 className="text-lg font-semibold">{meta.label}</h3>
                    <p className="text-sm text-muted-foreground">{meta.tagline}</p>
                  </div>
                  <p className="text-3xl font-bold">
                    ₹{meta.monthlyInr.toLocaleString("en-IN")}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      /mo
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">{meta.segment}</p>
                  <Button
                    asChild
                    variant={featured ? "default" : "outline"}
                    className="mt-auto w-full"
                  >
                    <a href={`${appUrl}/sign-up`}>Choose {meta.label}</a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions, answered
          </h2>
          <Accordion type="single" collapsible className="mt-8">
            {FAQ.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-amber-500/10 p-10 text-center sm:p-16">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Stop losing leads in WhatsApp and spreadsheets.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Respond faster, look premium, and fill more dates directly.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/audit">
                Get your free AI audit <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={`${appUrl}/sign-up`}>Start free</a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

/** A self-contained faux dashboard preview for the hero. */
function HeroMockup() {
  const tiles = [
    { label: "New enquiries", value: "12" },
    { label: "Site visits", value: "5" },
    { label: "Deposits", value: "3" },
  ];
  const pipeline = [
    { label: "New", n: 12, tone: "bg-primary/15 text-primary" },
    { label: "Qualified", n: 8, tone: "bg-primary/15 text-primary" },
    { label: "Visit", n: 5, tone: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    { label: "Deposit", n: 3, tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  ];
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/15 to-amber-500/10 blur-2xl" />
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
        <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-2 text-xs text-muted-foreground">
            app.venuepilot.in
          </span>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Overview</p>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              +18% this month
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-lg border bg-background p-3">
                <p className="text-2xl font-semibold">{t.value}</p>
                <p className="text-[11px] text-muted-foreground">{t.label}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Conversion pipeline
            </p>
            <div className="grid grid-cols-4 gap-2">
              {pipeline.map((p) => (
                <div key={p.label} className="rounded-lg border bg-background p-2 text-center">
                  <span
                    className={cn(
                      "mx-auto flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                      p.tone,
                    )}
                  >
                    {p.n}
                  </span>
                  <p className="mt-1 text-[10px] text-muted-foreground">{p.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">
                AI reply drafted for Priya &amp; Aman
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                “Haan ji, 14 Feb available hai — site visit book karein?”
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
