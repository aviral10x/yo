"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

import { logActivity } from "@/lib/activity";
import { anthropicConfigured, generateObject } from "@/lib/ai/claude";
import { getDb, schema } from "@/lib/db";
import { getActiveOrg } from "@/lib/org";
import { MEDIA_PACK_CHECKLIST } from "@/lib/constants";
import {
  FALLBACK_TAGS_BY_CATEGORY,
  GENERIC_FALLBACK_TAGS,
} from "@/components/operations/constants";

export type UploadResult = { ok: boolean; message: string };
export type TagResult = { ok: boolean; message: string; tags?: string[]; usedAi?: boolean };

const ROUTE = "/dashboard/media";

function labelFor(category: string): string {
  return (
    MEDIA_PACK_CHECKLIST.find((c) => c.category === category)?.label ?? category
  );
}

function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.trim().toLowerCase().replace(/\s+/g, " ");
    if (!t || t.length > 32) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= 8) break;
  }
  return out;
}

function fallbackTags(category: string): string[] {
  return normalizeTags(FALLBACK_TAGS_BY_CATEGORY[category] ?? GENERIC_FALLBACK_TAGS);
}

/**
 * Upload affordance stub. Real file ingestion (blob storage + AI auto-tagging
 * via Claude vision) lands in a later phase; here we record intent so the
 * activity stream and UX are wired end-to-end.
 */
export async function requestUpload(category: string): Promise<UploadResult> {
  const org = await getActiveOrg();
  if (!org) {
    return {
      ok: false,
      message: "Connect a database to upload and auto-tag photos.",
    };
  }
  await logActivity({
    organizationId: org.id,
    type: "media.upload_requested",
    payload: { category },
  });
  return {
    ok: true,
    message: "Uploader is being prepared — your file will be auto-tagged.",
  };
}

/**
 * Propose AI tags for a photo category. Uses Claude (forced tool-use for a
 * clean string[]) when configured, and a sensible per-category fallback
 * otherwise — so the feature always returns useful tags with zero setup.
 *
 * Tagging is non-destructive: it only proposes. The owner edits/saves the chips
 * via {@link saveTags}.
 */
export async function autoTagCategory(category: string): Promise<TagResult> {
  const label = labelFor(category);

  if (!anthropicConfigured) {
    return {
      ok: true,
      usedAi: false,
      tags: fallbackTags(category),
      message: "Suggested tags ready (add an API key for AI tagging).",
    };
  }

  try {
    const result = await generateObject<{ tags: string[] }>({
      tier: "haiku",
      toolName: "photo_tags",
      toolDescription:
        "Return concise, search-friendly tags for an Indian wedding venue photo.",
      system:
        "You tag photos for an Indian wedding venue's media library. Tags must be short (1-2 words), lowercase, concrete and visual — things a venue owner would search for (e.g. mandap, night lighting, rain backup, valet, floral backdrop). No sentences, no punctuation.",
      prompt: `Suggest 5-7 tags for a venue photo in the "${label}" category (slug: ${category}).`,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          tags: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 8,
          },
        },
        required: ["tags"],
      },
      maxTokens: 300,
    });
    const tags = normalizeTags(result.tags ?? []);
    const final = tags.length ? tags : fallbackTags(category);

    const org = await getActiveOrg();
    await logActivity({
      organizationId: org?.id,
      type: "media.auto_tagged",
      payload: { category, count: final.length, usedAi: true },
    });

    return { ok: true, usedAi: true, tags: final, message: "AI suggested tags." };
  } catch {
    return {
      ok: true,
      usedAi: false,
      tags: fallbackTags(category),
      message: "AI was unavailable — used suggested tags.",
    };
  }
}

/**
 * Persist the (possibly hand-edited) tag set for every media asset in a
 * category. Org-scoped; demo-safe (returns a hint when no DB).
 */
export async function saveTags(
  category: string,
  tags: string[],
): Promise<UploadResult> {
  const org = await getActiveOrg();
  if (!org) {
    return { ok: false, message: "Connect a database to save tags." };
  }
  const clean = normalizeTags(tags);
  try {
    await getDb()
      .update(schema.mediaAssets)
      .set({ aiTags: clean })
      .where(
        and(
          eq(schema.mediaAssets.organizationId, org.id),
          eq(schema.mediaAssets.category, category as never),
        ),
      );
    await logActivity({
      organizationId: org.id,
      type: "media.tags_saved",
      payload: { category, count: clean.length },
    });
    revalidatePath(ROUTE);
    return { ok: true, message: "Tags saved." };
  } catch {
    return { ok: false, message: "Could not save tags. Try again." };
  }
}
