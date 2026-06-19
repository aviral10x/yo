/**
 * Shared types + option catalogues for Content Studio — the AI marketing
 * showpiece. Kept framework-free so both the server action and the client UI
 * can import them.
 */

import type { LucideIcon } from "lucide-react";
import {
  CloudRain,
  Crown,
  Flower2,
  Moon,
  PartyPopper,
  Sparkles,
  Sun,
  Utensils,
} from "lucide-react";

/** Social platforms we tailor copy + format for. */
export const STUDIO_PLATFORMS = [
  {
    value: "instagram_post",
    label: "Instagram Post",
    hint: "Single image / carousel",
  },
  { value: "instagram_reel", label: "Instagram Reel", hint: "15–30s vertical" },
  { value: "instagram_story", label: "Instagram Story", hint: "9:16 quick tap" },
] as const;

export type StudioPlatform = (typeof STUDIO_PLATFORMS)[number]["value"];

export const PLATFORM_LABEL: Record<StudioPlatform, string> = {
  instagram_post: "Instagram Post",
  instagram_reel: "Instagram Reel",
  instagram_story: "Instagram Story",
};

/**
 * Ready-made occasion/theme starters keyed to the standard venue photo pack.
 * Owners can also type their own — these just seed the idea.
 */
export const STUDIO_THEMES: {
  value: string;
  label: string;
  prompt: string;
  icon: LucideIcon;
}[] = [
  {
    value: "lawn_night",
    label: "Lawn at night",
    prompt: "Show the lawn at night under the fairy lights",
    icon: Moon,
  },
  {
    value: "mandap",
    label: "Mandap setup",
    prompt: "A grand floral mandap setup ready for the pheras",
    icon: Flower2,
  },
  {
    value: "rain_backup",
    label: "Rain-backup hall",
    prompt: "Our covered rain-backup hall — no monsoon worries",
    icon: CloudRain,
  },
  {
    value: "sangeet",
    label: "Sangeet night",
    prompt: "A high-energy sangeet night on the lawn",
    icon: PartyPopper,
  },
  {
    value: "haldi",
    label: "Daytime haldi",
    prompt: "A bright, marigold-yellow daytime haldi by the poolside",
    icon: Sun,
  },
  {
    value: "catering",
    label: "Catering spread",
    prompt: "An elaborate live-counter catering spread",
    icon: Utensils,
  },
  {
    value: "entrance",
    label: "Grand entrance",
    prompt: "The grand lit-up entrance welcoming the baraat",
    icon: Crown,
  },
  {
    value: "wedding_full",
    label: "Full wedding",
    prompt: "A full wedding day at the venue, decor to dance floor",
    icon: Sparkles,
  },
];

/** One named hashtag bundle the owner can copy as a unit. */
export type HashtagSet = {
  label: string;
  tags: string[];
};

/** A single shot in the reel storyboard. */
export type ShotListItem = {
  time: string;
  shot: string;
  text?: string;
};

/** The full generated content package. */
export type StudioContent = {
  caption: string;
  hashtagSets: HashtagSet[];
  hook: string;
  shotList: ShotListItem[];
  audioSuggestion: string;
  cta: string;
};

export type GenerateContentInput = {
  theme: string;
  platform: StudioPlatform;
};

export type GenerateContentResult =
  | { ok: true; content: StudioContent; source: "ai" | "template" }
  | { ok: false; message: string };
