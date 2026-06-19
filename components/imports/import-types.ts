/**
 * Shared types + catalogues for the Marketplace Lead Import slice. Kept
 * framework-free so both the server action (parser/persistence) and the client
 * UI can import them without pulling server-only code into the bundle.
 */

import type { LucideIcon } from "lucide-react";
import { Globe, Heart, Mail, MapPin } from "lucide-react";

/**
 * The normalized, editable shape produced by the parser and consumed by the
 * preview card + import action. Strings only (date kept as the raw entered
 * value) so the editable form never has to coerce types.
 */
export type ParsedEnquiry = {
  coupleName: string;
  phone: string;
  email: string;
  eventType: string;
  /** Free-text or yyyy-mm-dd; normalized to a date on import. */
  date: string;
  guestCount: string;
  city: string;
  /** A leadSourceEnum value detected from the marketplace header. */
  source: string;
};

export type ParseEnquiryResult =
  | { ok: true; parsed: ParsedEnquiry; source: "ai" | "template" }
  | { ok: false; message: string };

export type ImportLeadResult =
  | { ok: true; message: string }
  | { ok: false; message: string; reason?: "duplicate" | "no_venue" | "no_db" };

/**
 * Marketplace connectors a venue can wire up. `source` maps to leadSourceEnum so
 * imports from each one are tagged correctly in the leads pipeline.
 */
export type Connector = {
  id: string;
  name: string;
  /** leadSourceEnum value, or null for the generic email-forwarding inbox. */
  source: "wedmegood" | "weddingz" | "venuelook" | null;
  blurb: string;
  icon: LucideIcon;
  /** Tailwind classes for the connector's accent tile. */
  tone: string;
};

export const CONNECTORS: Connector[] = [
  {
    id: "wedmegood",
    name: "WedMeGood",
    source: "wedmegood",
    blurb:
      "India's largest wedding marketplace. Auto-pull enquiries the moment a couple shortlists your venue.",
    icon: Heart,
    tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    id: "weddingz",
    name: "Weddingz",
    source: "weddingz",
    blurb:
      "OYO's venue network. Sync banquet & lawn enquiries straight into your pipeline.",
    icon: Globe,
    tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    id: "venuelook",
    name: "VenueLook",
    source: "venuelook",
    blurb:
      "Capture VenueLook leads automatically, with date and guest count pre-filled.",
    icon: MapPin,
    tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
];

/** The email-forwarding inbox — always "available", no third-party connect. */
export const EMAIL_CONNECTOR = {
  id: "email",
  name: "Email forwarding",
  icon: Mail,
  tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  /** The (illustrative) inbox owners forward marketplace mails to. */
  inbox: "imports@venuepilot.app",
  blurb:
    "Forward your marketplace enquiry emails here and we'll parse and file each one into your pipeline automatically.",
} as const;
