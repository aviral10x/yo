"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity";
import { anthropicConfigured, draftText } from "@/lib/ai/claude";
import { getDb, schema } from "@/lib/db";
import { getActiveOrg } from "@/lib/org";

const REPLY_SYSTEM =
  "You are a venue owner replying to a wedding enquiry on WhatsApp. Be warm, concise, and helpful. Reply in the same language as the customer (English/Hindi/Hinglish).";

export type DraftReplyState = {
  ok: boolean;
  text?: string;
  source?: "ai" | "template";
  message?: string;
};

/** Lightweight templated reply when no model key is configured. */
function templatedReply(input: {
  couple: string;
  body: string;
  venue?: string;
}): string {
  const first = input.couple.split(/&|,| and /i)[0]?.trim() || "there";
  const venue = input.venue || "our venue";
  const msg = input.body.toLowerCase();

  if (/(avail|date|free|book)/.test(msg)) {
    return `Namaste ${first}! Thank you for reaching out to ${venue}. Yes, we'd love to host your celebration — let me check that date and share availability right away. Could you confirm the guest count so I can suggest the perfect space? We can also arrange a site visit this week.`;
  }
  if (/(price|plate|cost|package|rate|budget|veg)/.test(msg)) {
    return `Hi ${first}! Happy to help. Our packages are tailored to your guest count and menu — veg plates start around ₹1,200 and our all-inclusive Gold package is a favourite for weddings. Shall I share the detailed menus and a custom quote on WhatsApp?`;
  }
  if (/(visit|see|tour|location|address)/.test(msg)) {
    return `Namaste ${first}! We'd be delighted to show you around ${venue}. We're open for site visits daily 11am–7pm — just let me know a time that suits you and I'll keep the team ready with chai. 😊`;
  }
  return `Namaste ${first}! Thank you for your enquiry — we'd love to be part of your big day at ${venue}. Tell me a little more about your date and guest count, and I'll put together the perfect plan for you.`;
}

/**
 * Draft a warm, bilingual reply to an inbound enquiry. Uses Claude when a key
 * is configured; otherwise returns the demo aiDraft passed by the caller, or a
 * templated fallback. Human-in-the-loop: the owner edits before sending.
 */
export async function draftReply(input: {
  couple: string;
  body: string;
  venue?: string;
  fallback?: string;
  context?: string;
}): Promise<DraftReplyState> {
  const couple = input.couple?.trim();
  const body = input.body?.trim();
  if (!couple || !body) {
    return { ok: false, message: "Nothing to reply to." };
  }

  if (anthropicConfigured) {
    try {
      const prompt = [
        `You run "${input.venue || "a wedding venue"}".`,
        input.context ? `Context: ${input.context}.` : "",
        `The couple "${couple}" sent this on WhatsApp:`,
        `"${body}"`,
        "",
        "Write ONE short reply (2–4 sentences) you could send right now. Match their language. Be warm and specific; nudge gently toward a site visit or sharing details. No greeting placeholders, no signature.",
      ]
        .filter(Boolean)
        .join("\n");

      const text = (await draftText({ prompt, system: REPLY_SYSTEM })).trim();
      if (text) return { ok: true, text, source: "ai" };
    } catch {
      // fall through to template
    }
  }

  if (input.fallback?.trim()) {
    return { ok: true, text: input.fallback.trim(), source: "template" };
  }
  return {
    ok: true,
    text: templatedReply({ couple, body, venue: input.venue }),
    source: "template",
  };
}

/**
 * Persist + "send" an owner reply. With a live org we write an outbound message
 * row and log activity; without one we return a friendly notice and let the UI
 * optimistically show the bubble.
 */
export async function sendReply(input: {
  conversationId?: string;
  body: string;
}): Promise<{ ok: boolean; message: string }> {
  const body = input.body?.trim();
  if (!body) return { ok: false, message: "Reply can't be empty." };

  const org = await getActiveOrg();
  if (!org) {
    return { ok: true, message: "Reply sent" };
  }

  if (!input.conversationId) {
    return { ok: false, message: "Pick a conversation first." };
  }

  try {
    const db = getDb();
    // Ownership check: the conversation must belong to the active org.
    const [convo] = await db
      .select({ id: schema.conversations.id })
      .from(schema.conversations)
      .where(
        and(
          eq(schema.conversations.id, input.conversationId),
          eq(schema.conversations.organizationId, org.id),
        ),
      )
      .limit(1);

    if (!convo) return { ok: false, message: "Conversation not found." };

    await db.insert(schema.messages).values({
      organizationId: org.id,
      conversationId: convo.id,
      direction: "out",
      body,
      sentAt: new Date(),
    });

    await logActivity({
      organizationId: org.id,
      type: "message_sent",
      payload: { conversationId: convo.id, length: body.length },
    });

    revalidatePath("/dashboard/messages");
    return { ok: true, message: "Reply sent" };
  } catch {
    return { ok: false, message: "Couldn't send just now. Try again." };
  }
}
