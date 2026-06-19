/**
 * Operations-slice constants — the standard run-of-show menu courses every
 * wedding event is prepped against, plus the per-category fallback tag library
 * used when Claude isn't configured. Kept inside the owned folder.
 */

import type { MenuCourse } from "./types";

/** The default menu the team selects from, organised by course. */
export const STANDARD_MENU_COURSES: MenuCourse[] = [
  {
    course: "Welcome drinks",
    items: [
      { label: "Aam panna", selected: false },
      { label: "Masala chaas", selected: false },
      { label: "Kesar thandai", selected: false },
      { label: "Fresh coconut water", selected: false },
    ],
  },
  {
    course: "Live counters",
    items: [
      { label: "Chaat & golgappa", selected: false },
      { label: "Dosa & uttapam", selected: false },
      { label: "Pasta / pizza station", selected: false },
      { label: "Tandoor live grill", selected: false },
    ],
  },
  {
    course: "Starters (veg)",
    items: [
      { label: "Paneer tikka", selected: false },
      { label: "Hara bhara kebab", selected: false },
      { label: "Dahi ke kebab", selected: false },
      { label: "Crispy corn", selected: false },
    ],
  },
  {
    course: "Starters (non-veg)",
    items: [
      { label: "Murgh malai tikka", selected: false },
      { label: "Mutton seekh", selected: false },
      { label: "Fish amritsari", selected: false },
    ],
  },
  {
    course: "Main course",
    items: [
      { label: "Dal makhani", selected: false },
      { label: "Paneer lababdar", selected: false },
      { label: "Veg biryani", selected: false },
      { label: "Butter chicken", selected: false },
      { label: "Assorted breads", selected: false },
    ],
  },
  {
    course: "Desserts",
    items: [
      { label: "Gulab jamun", selected: false },
      { label: "Moong dal halwa", selected: false },
      { label: "Ice cream cart", selected: false },
      { label: "Paan station", selected: false },
    ],
  },
];

/**
 * Sensible fallback tags per photo category — used when ANTHROPIC_API_KEY is
 * not set, so "Auto-tag with AI" always returns something useful.
 */
export const FALLBACK_TAGS_BY_CATEGORY: Record<string, string[]> = {
  entrance: ["entrance", "gate", "welcome signage", "daylight"],
  lawn_wide: ["lawn", "open-air", "wide shot", "greenery"],
  stage: ["mandap", "stage", "floral backdrop", "wedding ceremony"],
  buffet: ["buffet", "catering setup", "live counter", "dining"],
  bridal_room: ["bridal room", "getting ready", "vanity", "interior"],
  guest_room: ["guest room", "accommodation", "twin beds", "interior"],
  parking: ["parking", "valet", "driveway", "vehicles"],
  washroom: ["washroom", "amenities", "clean", "interior"],
  lighting: ["night lighting", "fairy lights", "ambient", "evening"],
  rain_backup: ["rain backup hall", "indoor", "covered", "all-weather"],
  team: ["team photo", "staff", "hospitality", "group"],
  live_event: ["live event", "celebration", "guests", "wedding"],
  other: ["venue", "wedding", "decor", "ambient"],
};

/** Stable default tag set when a category isn't recognised. */
export const GENERIC_FALLBACK_TAGS = ["venue", "wedding", "ambient", "decor"];
