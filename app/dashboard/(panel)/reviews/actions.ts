"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { draftText, anthropicConfigured } from "@/lib/ai/claude";
import { logActivity } from "@/lib/activity";
import { getDb, schema } from "@/lib/db";
import { getActiveOrg } from "@/lib/org";

const REVIEW_REPLY_SYSTEM =
  "You write warm, professional venue review replies for an Indian wedding venue. Keep it 1-2 sentences.";

const REVIEWS_PATH = "/dashboard/reviews";

export type DraftReplyState =
  | { ok: true; draft: string; generatedByAI: boolean }
  | { ok: false; message: string };

export type SaveResponseState = { ok: boolean; message: string };

function firstName(author: string | null | undefined): string {
  const name = (author ?? "").trim();
  if (!name) return "";
  return name.split(/\s+/)[0];
}

/**
 * Build a sensible, on-brand reply when no Anthropic key is configured. The
 * tone matches the AI system prompt: warm, 1-2 sentences, India-aware.
 */
function templatedReply(input: {
  author?: string | null;
  rating?: number | null;
  text?: string | null;
}): string {
  const name = firstName(input.author);
  const greeting = name ? `Thank you so much, ${name}!` : "Thank you so much!";
  const rating = input.rating ?? 0;
  if (rating >= 4) {
    return `${greeting} It was an absolute joy hosting your celebration, and we'd be delighted to welcome you and your family back to the venue anytime.`;
  }
  if (rating === 3) {
    return `${greeting} We're grateful for your honest feedback and are already working on the points you raised — we'd love the chance to host you again and make it even better.`;
  }
  return `${greeting} We're truly sorry your experience fell short of our standards. Please reach out to our team directly so we can make this right — your feedback means a great deal to us.`;
}

/**
 * Draft a reply to a review. Uses Claude (haiku tier) when configured, else a
 * polished templated fallback so the feature is fully usable without an API key.
 * Read-only — nothing is persisted until the owner clicks "Save response".
 */
export async function draftReply(input: {
  author?: string | null;
  rating?: number | null;
  text?: string | null;
  source?: string | null;
}): Promise<DraftReplyState> {
  const reviewText = (input.text ?? "").trim();

  if (!anthropicConfigured) {
    return { ok: true, draft: templatedReply(input), generatedByAI: false };
  }

  try {
    const prompt = [
      `A guest left a ${input.rating ?? "?"}-star review${
        input.source ? ` on ${input.source}` : ""
      }${input.author ? ` (author: ${input.author})` : ""}.`,
      reviewText ? `Review: "${reviewText}"` : "No review text was provided.",
      "Write a single warm, professional reply from the venue. Address the guest by first name if available. Do not use placeholders or square brackets.",
    ].join("\n\n");

    const draft = await draftText({
      system: REVIEW_REPLY_SYSTEM,
      prompt,
      tier: "haiku",
      maxTokens: 300,
    });

    const cleaned = draft.trim();
    if (!cleaned) {
      return { ok: true, draft: templatedReply(input), generatedByAI: false };
    }
    return { ok: true, draft: cleaned, generatedByAI: true };
  } catch {
    // Never fail the action — fall back to the templated reply.
    return { ok: true, draft: templatedReply(input), generatedByAI: false };
  }
}

/**
 * Persist a review response. Demo-safe: with no org we return a friendly
 * message and the UI keeps the typed draft so nothing is lost.
 */
export async function saveResponse(input: {
  reviewId: string;
  response: string;
}): Promise<SaveResponseState> {
  const response = input.response.trim();
  if (!response) {
    return { ok: false, message: "Write a response before saving." };
  }

  const org = await getActiveOrg();
  if (!org) {
    return { ok: false, message: "Connect a database to save changes." };
  }

  try {
    await getDb()
      .update(schema.reviews)
      .set({ response, respondedAt: new Date() })
      .where(
        and(
          eq(schema.reviews.id, input.reviewId),
          eq(schema.reviews.organizationId, org.id),
        ),
      );

    await logActivity({
      organizationId: org.id,
      type: "review.responded",
      payload: { reviewId: input.reviewId },
    });

    revalidatePath(REVIEWS_PATH);
    return { ok: true, message: "Response published." };
  } catch {
    return {
      ok: false,
      message: "We couldn't save that just now. Please try again.",
    };
  }
}

/**
 * Stub: in production this would send a WhatsApp/email review request to a
 * recent confirmed couple. Demo-safe and always succeeds.
 */
export async function requestReview(): Promise<{ ok: boolean; message: string }> {
  const org = await getActiveOrg();
  if (org) {
    await logActivity({ organizationId: org.id, type: "review.requested" });
  }
  return { ok: true, message: "Review request sent" };
}
