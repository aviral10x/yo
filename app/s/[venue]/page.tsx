import Image from "next/image";
import { CalendarCheck, MapPin, Phone, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { VENUE_TYPE_LABELS } from "@/lib/constants";
import { resolveVenue } from "@/lib/tenant";

// Curated stock imagery for demo sites — replaced by each venue's real photos.
const HEROES = [
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1600&q=80&auto=format&fit=crop",
];
const GALLERY = [
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80&auto=format&fit=crop",
];

function humanize(slug: string) {
  return slug
    .replace(/[-_.]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
function pick<T>(arr: T[], seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return arr[h % arr.length];
}

export default async function VenueSite({
  params,
}: {
  params: Promise<{ venue: string }>;
}) {
  const { venue: slug } = await params;
  const venue = await resolveVenue(slug);

  const name = venue?.name ?? humanize(slug);
  const type = venue?.type ? VENUE_TYPE_LABELS[venue.type] : "Wedding Venue";
  const location = [venue?.city, venue?.state].filter(Boolean).join(", ");
  const hero = pick(HEROES, slug);
  // Placeholder contact until a venue contact number lives in settings.
  const phone = "+919000000000";
  const phoneDigits = phone.replace(/\D/g, "");
  const waHref = `https://wa.me/${phoneDigits}`;
  const telHref = `tel:${phone}`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/20 text-white backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="font-serif text-lg font-semibold tracking-wide">
            {name}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" asChild>
              <a href="#enquire">
                <CalendarCheck className="size-4" /> Check availability
              </a>
            </Button>
            <Button size="sm" className="hidden sm:inline-flex" asChild>
              <a href="#enquire">Enquire</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate flex min-h-[78vh] items-end bg-emerald-950">
        <Image
          src={hero}
          alt={name}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 text-white">
          {!venue && (
            <span className="mb-4 inline-block rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
              Preview site — connect a database to load real venue data
            </span>
          )}
          <p className="text-sm uppercase tracking-[0.2em] text-white/80">
            {type}
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-5xl font-semibold leading-tight sm:text-7xl">
            {name}
          </h1>
          {location && (
            <p className="mt-4 flex items-center gap-2 text-lg text-white/85">
              <MapPin className="size-5" /> {location}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <a href="#enquire">
                <CalendarCheck className="size-4" /> Check your date
              </a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="#enquire">Book a site visit</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick facts */}
      <section className="border-b bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-8 sm:grid-cols-4">
          {[
            { icon: Users, label: "Capacity", value: "Up to 1,000" },
            { icon: MapPin, label: "Spaces", value: "Lawn + Hall" },
            { icon: CalendarCheck, label: "Best for", value: "Weddings" },
            { icon: Phone, label: "Response", value: "Within minutes" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-medium">{f.value}</p>
                <p className="text-xs text-muted-foreground">{f.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="font-serif text-3xl font-semibold">A setting to remember</h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          {venue?.story ??
            `${name} blends manicured lawns, elegant indoor spaces, and warm hospitality into one effortless celebration. From intimate ceremonies to grand receptions, every detail is taken care of — so you can simply enjoy the day.`}
        </p>
      </section>

      {/* Spaces */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-serif text-3xl font-semibold">Our spaces</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              ["The Lawn", "Open-air ceremonies under the stars, up to 800 guests."],
              ["The Banquet Hall", "Air-conditioned elegance for 400 guests."],
              ["Bridal Suite", "A private space to get ready in comfort."],
            ].map(([t, b]) => (
              <div key={t} className="rounded-xl border bg-card p-6">
                <h3 className="font-serif text-xl">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-serif text-3xl font-semibold">Gallery</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {GALLERY.map((src, i) => (
            <div key={i} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
              <Image
                src={src}
                alt={`${name} photo ${i + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Enquiry CTA */}
      <section id="enquire" className="scroll-mt-16 bg-emerald-950 text-emerald-50">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
            Is your date available?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-emerald-100/80">
            Message us on WhatsApp or call — we reply within minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="bg-white text-emerald-950 hover:bg-white/90"
              asChild
            >
              <a href={waHref} target="_blank" rel="noopener noreferrer">
                <Phone className="size-4" /> WhatsApp us
              </a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href={telHref}>
                <Phone className="size-4" /> Call us
              </a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t bg-card py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-1.5 px-6 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          Powered by VenuePilot
        </div>
      </footer>
    </div>
  );
}
