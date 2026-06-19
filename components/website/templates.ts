/**
 * Website template catalogue + the GBP completeness checklist shape. Kept inside
 * the website slice so it stays self-contained. The public render
 * (app/s/[venue]) owns the actual theming; this is the picker metadata.
 */

export type WebsiteTemplate = {
  id: string;
  name: string;
  tagline: string;
  /** Best-fit venue style, shown as a hint chip. */
  bestFor: string;
  /** Tailwind classes for the preview swatch gradient. */
  swatch: string;
  /** Accent dot colour for the preview chrome. */
  accent: string;
};

export const WEBSITE_TEMPLATES: WebsiteTemplate[] = [
  {
    id: "classic",
    name: "Classic",
    tagline: "Timeless serif headings with a calm, editorial layout.",
    bestFor: "Banquet halls",
    swatch: "from-stone-100 to-amber-50",
    accent: "bg-amber-500",
  },
  {
    id: "elegant",
    name: "Elegant",
    tagline: "Soft ivory tones, lots of whitespace, refined typography.",
    bestFor: "Wedding resorts",
    swatch: "from-rose-50 to-stone-50",
    accent: "bg-rose-400",
  },
  {
    id: "modern",
    name: "Modern",
    tagline: "Bold full-bleed hero, crisp grid, high-contrast CTAs.",
    bestFor: "Hotel venues",
    swatch: "from-slate-100 to-emerald-50",
    accent: "bg-emerald-500",
  },
  {
    id: "garden",
    name: "Garden",
    tagline: "Lush greens and floral accents for open-air lawns.",
    bestFor: "Marriage gardens",
    swatch: "from-emerald-50 to-lime-50",
    accent: "bg-lime-600",
  },
];

/** The Google Business Profile completeness checklist (high-leverage items). */
export const GBP_CHECKLIST = [
  {
    id: "claimed",
    label: "Profile claimed & verified",
    hint: "Own the listing so you control hours, photos, and replies.",
  },
  {
    id: "hours",
    label: "Opening hours set",
    hint: "Add weekday hours; mark special days for the wedding season.",
  },
  {
    id: "booking_link",
    label: "Booking / enquiry link added",
    hint: "Point the 'Book' button straight at your venue website.",
  },
  {
    id: "photos",
    label: "12+ photos uploaded",
    hint: "Cover the full photo pack — entrance, stage, lawn, lighting.",
  },
  {
    id: "reviews_responded",
    label: "Recent reviews responded to",
    hint: "Reply within 48 hours; it lifts ranking and trust.",
  },
  {
    id: "categories",
    label: "Primary category set to 'Wedding venue'",
    hint: "Add 'Banquet hall' and 'Event venue' as secondary categories.",
  },
] as const;
