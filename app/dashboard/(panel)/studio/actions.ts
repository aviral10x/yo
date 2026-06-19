"use server";

import { logActivity } from "@/lib/activity";
import { anthropicConfigured, generateObject } from "@/lib/ai/claude";
import { DEMO_VENUE } from "@/lib/demo-data";
import { getActiveOrg } from "@/lib/org";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  PLATFORM_LABEL,
  STUDIO_PLATFORMS,
  type GenerateContentInput,
  type GenerateContentResult,
  type StudioContent,
  type StudioPlatform,
} from "@/components/studio/studio-types";

const SYSTEM =
  "You are an expert social media manager for premium Indian wedding venues. " +
  "You write scroll-stopping, on-brand, India-aware copy for venue owners to post. " +
  "You know the Indian wedding calendar, regional flavour, and what couples search for. " +
  "Optional light Hinglish is welcome where it feels natural and warm — never forced. " +
  "Hashtags are realistic and discoverable (city + wedding + venue niche). " +
  "Never use placeholders, brackets, or emoji spam. Output strictly via the provided tool.";

const VALID_PLATFORMS = new Set<string>(STUDIO_PLATFORMS.map((p) => p.value));

/** JSON Schema for the structured generation (Claude tool-use). */
const CONTENT_SCHEMA = {
  type: "object",
  properties: {
    caption: {
      type: "string",
      description:
        "The post caption, ready to paste. Warm, specific to the theme and venue, 2–4 short lines. Tasteful emoji allowed.",
    },
    hook: {
      type: "string",
      description:
        "A punchy 1-line opening hook / on-screen text for the first second of the reel.",
    },
    hashtagSets: {
      type: "array",
      description: "2-3 named hashtag bundles for different reach strategies.",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          label: { type: "string", description: "Bundle name e.g. 'Local reach'." },
          tags: {
            type: "array",
            items: { type: "string", description: "A hashtag including the # sign." },
            minItems: 4,
            maxItems: 10,
          },
        },
        required: ["label", "tags"],
      },
    },
    shotList: {
      type: "array",
      description: "A short reel storyboard / shot-list, 4-6 shots.",
      minItems: 4,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          time: { type: "string", description: "Timecode e.g. '0:00–0:03'." },
          shot: { type: "string", description: "What the camera shows / movement." },
          text: { type: "string", description: "Optional on-screen text for this shot." },
        },
        required: ["time", "shot"],
      },
    },
    audioSuggestion: {
      type: "string",
      description: "A trending-style audio / music direction suited to the vibe.",
    },
    cta: {
      type: "string",
      description: "A single clear call to action (DM, save the date, enquire).",
    },
  },
  required: ["caption", "hook", "hashtagSets", "shotList", "audioSuggestion", "cta"],
} as const;

function venueLabel(name: string, city: string): string {
  return `${name}, ${city}`;
}

/** Resolve the venue name/city for prompting + templating (live or demo). */
async function resolveVenue(): Promise<{ name: string; city: string }> {
  const org = await getActiveOrg();
  if (!org) return { name: DEMO_VENUE.name, city: DEMO_VENUE.city };
  try {
    const [venue] = await getDb()
      .select({ name: schema.venues.name, city: schema.venues.city })
      .from(schema.venues)
      .where(eq(schema.venues.organizationId, org.id))
      .limit(1);
    return {
      name: venue?.name ?? org.name ?? DEMO_VENUE.name,
      city: venue?.city ?? DEMO_VENUE.city,
    };
  } catch {
    return { name: DEMO_VENUE.name, city: DEMO_VENUE.city };
  }
}

function citySlug(city: string): string {
  return city.replace(/\s+/g, "");
}

/**
 * A genuinely strong, on-brand templated package for when no Anthropic key is
 * set. Keyed off the chosen theme + the venue's name/city so it never feels
 * canned. This is the no-DB / no-API showpiece path.
 */
function templatedContent(
  theme: string,
  platform: StudioPlatform,
  venue: { name: string; city: string },
): StudioContent {
  const t = theme.trim() || "your dream wedding";
  const name = venue.name;
  const city = venue.city;
  const cs = citySlug(city);
  const isReel = platform === "instagram_reel";
  const isStory = platform === "instagram_story";

  const caption = isStory
    ? `${t} at ${name} ✨\nTap to save the date 👇\n📍 ${city}`
    : `${t} — and it's all happening at ${name}. 💍\n\n` +
      `Picture this: ${t.toLowerCase()}, your closest people, and a setting that does half the work for you. ` +
      `Dates for the season are filling fast.\n\n` +
      `Shaadi planning? Let's make it unforgettable. DM us to book a site visit. 📍 ${city}`;

  const hashtagSets = [
    {
      label: "Local reach",
      tags: [
        `#${cs}Weddings`,
        `#${cs}Venue`,
        `#WeddingsIn${cs}`,
        `#${cs}Shaadi`,
        "#IndianWeddingVenue",
        "#DestinationWedding",
      ],
    },
    {
      label: "Discovery & trends",
      tags: [
        "#BigFatIndianWedding",
        "#ShaadiSeason",
        "#WeddingInspiration",
        "#MandapDecor",
        "#WeddingReels",
        "#TheBigDay",
        "#WeddingVibes",
      ],
    },
    {
      label: "Niche & high-intent",
      tags: [
        "#WeddingVenueIndia",
        "#WedMeGood",
        "#ShaadiSaga",
        "#WeddingPlanning",
        "#SiteVisit",
        "#BookYourDate",
      ],
    },
  ];

  const hook = isReel
    ? `POV: you walk into ${name} and the planning stress disappears.`
    : `${t} at ${name} hits different.`;

  const shotList = [
    {
      time: "0:00–0:03",
      shot: `Slow push-in reveal — ${t.toLowerCase()}, lights coming up.`,
      text: hook,
    },
    {
      time: "0:03–0:07",
      shot: "Wide drone / gimbal sweep across the full setup.",
      text: `Welcome to ${name}`,
    },
    {
      time: "0:07–0:12",
      shot: "Detail macros — flowers, cutlery, fairy lights, textures.",
      text: "It's all in the details ✨",
    },
    {
      time: "0:12–0:18",
      shot: "Guests/couple candid — laughter, the first look, the dance floor.",
      text: "Your people. Your moment.",
    },
    {
      time: "0:18–0:24",
      shot: `Golden-hour hero shot of ${name} with logo lower-third.`,
      text: `📍 ${city} · DM to book`,
    },
  ];

  const audioSuggestion = isReel
    ? "A trending soft-Bollywood / Coke Studio instrumental that builds to a drop at the hero shot."
    : "Pair with a calm, romantic trending audio so the visuals lead.";

  const cta = isStory
    ? "Swipe up / tap the link to enquire — limited dates this season."
    : "DM us 'DATE' to check availability and book a site visit.";

  return { caption, hook, hashtagSets, shotList, audioSuggestion, cta };
}

/**
 * Generate a full content package (caption, hashtag sets, reel script/shot-list)
 * for the chosen theme + platform. Uses Claude structured output when a key is
 * configured; otherwise returns a strong templated package so the feature is
 * fully usable with no DB and no API key. Read-only — nothing is persisted; the
 * owner copies what they want.
 */
export async function generateContent(
  input: GenerateContentInput,
): Promise<GenerateContentResult> {
  const theme = (input?.theme ?? "").trim();
  const platform = input?.platform;

  if (!theme) {
    return { ok: false, message: "Pick or type a theme to generate." };
  }
  if (!platform || !VALID_PLATFORMS.has(platform)) {
    return { ok: false, message: "Choose a platform first." };
  }

  const venue = await resolveVenue();

  if (anthropicConfigured) {
    try {
      const prompt = [
        `Venue: ${venueLabel(venue.name, venue.city)} (a premium Indian wedding venue).`,
        `Platform: ${PLATFORM_LABEL[platform]}.`,
        `Theme / occasion to feature: "${theme}".`,
        "",
        "Produce a complete, ready-to-post content package for this exact theme and platform:",
        "- A caption tailored to the platform (Stories are short; Posts can be longer; Reels caption supports the video).",
        "- 2-3 named hashtag sets (local reach, trend/discovery, niche high-intent) using the venue's city.",
        "- A reel hook + a 4-6 shot storyboard with timecodes and on-screen text.",
        "- An audio/music direction and one clear CTA.",
        "Make it specific to THIS venue and theme — no generic filler.",
      ].join("\n");

      const content = await generateObject<StudioContent>({
        prompt,
        system: SYSTEM,
        schema: CONTENT_SCHEMA as unknown as Record<string, unknown>,
        toolName: "social_content_package",
        toolDescription:
          "Return a complete social content package for a wedding venue post.",
        tier: "sonnet",
        maxTokens: 1800,
      });

      // Guard against a thin response from the model.
      if (content?.caption && content.hashtagSets?.length && content.shotList?.length) {
        const org = await getActiveOrg();
        if (org) {
          await logActivity({
            organizationId: org.id,
            type: "studio.generated",
            payload: { theme, platform, source: "ai" },
          });
        }
        return { ok: true, content, source: "ai" };
      }
    } catch {
      // fall through to the templated package
    }
  }

  const content = templatedContent(theme, platform, venue);
  const org = await getActiveOrg();
  if (org) {
    await logActivity({
      organizationId: org.id,
      type: "studio.generated",
      payload: { theme, platform, source: "template" },
    });
  }
  return { ok: true, content, source: "template" };
}
