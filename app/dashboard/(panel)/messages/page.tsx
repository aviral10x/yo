import { Languages, MessageSquare, Sparkles, Timer } from "lucide-react";
import { asc, eq } from "drizzle-orm";

import { PageHeader } from "@/components/dashboard/page-header";
import { Stat } from "@/components/dashboard/stat";
import { Badge } from "@/components/ui/badge";
import { Inbox } from "@/components/messages/inbox";
import { initialsOf, type Thread } from "@/components/messages/types";
import { anthropicConfigured } from "@/lib/ai/claude";
import { getDb, schema } from "@/lib/db";
import { DEMO_LEADS, DEMO_MESSAGES, DEMO_VENUE } from "@/lib/demo-data";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { getActiveOrg } from "@/lib/org";

/**
 * Build rich demo threads: each inbound enquiry from DEMO_MESSAGES becomes a
 * conversation, enriched with the matching lead's context and a couple of
 * leading turns so the inbox feels alive without a database.
 */
function demoThreads(): Thread[] {
  const leadByCouple = new Map(DEMO_LEADS.map((l) => [l.coupleName, l]));

  const base: Thread[] = DEMO_MESSAGES.map((m, i) => {
    const lead = leadByCouple.get(m.couple);
    const context = lead
      ? `${EVENT_TYPE_LABELS[lead.eventType] ?? lead.eventType} · ${lead.guestCount} guests`
      : undefined;
    return {
      id: m.id,
      couple: m.couple,
      initials: initialsOf(m.couple),
      phone: lead?.phone,
      channel: "whatsapp" as const,
      context,
      unread: 1,
      messages: [
        {
          id: `${m.id}_greet`,
          direction: "in" as const,
          body: "Hello! 🙏",
          at: i === 0 ? "10:02" : "9:14",
        },
        {
          id: `${m.id}_in`,
          direction: "in" as const,
          body: m.body,
          at: i === 0 ? "10:03" : "9:15",
          aiDraft: m.aiDraft,
        },
      ],
    };
  });

  // A couple of extra textured threads for depth.
  base.push({
    id: "ms_demo_3",
    couple: "Neha & Rohit",
    initials: initialsOf("Neha & Rohit"),
    phone: "+91 98290 33333",
    channel: "whatsapp",
    context: "Reception · 300 guests",
    unread: 0,
    messages: [
      {
        id: "ms_demo_3_in1",
        direction: "in",
        body: "Aapke yahan reception ke liye 14 Dec available hai kya?",
        at: "Yest",
      },
      {
        id: "ms_demo_3_out1",
        direction: "out",
        body: "Namaste! Haan ji, 14 December reception ke liye available hai. Crystal Banquet Hall (400 tak) perfect rahega. Kya main aapko site visit fix kar doon?",
        at: "Yest",
      },
      {
        id: "ms_demo_3_in2",
        direction: "in",
        body: "Perfect, Sunday ko aa sakte hain?",
        at: "Yest",
        aiDraft:
          "Bilkul! Sunday ka swagat hai — 11am se 7pm tak kabhi bhi aa jaaiye. Main team ko ready rakhti hoon aur aapke liye chai-coffee ka intezaam bhi. Address bhej doon?",
      },
    ],
  });
  base.push({
    id: "ms_demo_4",
    couple: "Anjali & Vikram",
    initials: initialsOf("Anjali & Vikram"),
    phone: "+91 98290 44444",
    channel: "whatsapp",
    context: "Wedding · 800 guests",
    unread: 0,
    messages: [
      {
        id: "ms_demo_4_in1",
        direction: "in",
        body: "Loved the lawn during our visit! Can you share the Platinum package quote?",
        at: "Mon",
      },
      {
        id: "ms_demo_4_out1",
        direction: "out",
        body: "So glad you loved The Grand Lawn, Anjali! Sharing the Platinum quote now — it covers décor, catering at ₹2,800/plate, and rooms. I'll WhatsApp the PDF in 2 minutes.",
        at: "Mon",
      },
    ],
  });

  return base;
}

async function liveThreads(orgId: string): Promise<Thread[]> {
  const db = getDb();
  const rows = await db
    .select({
      conversationId: schema.conversations.id,
      channel: schema.conversations.channel,
      coupleName: schema.leads.coupleName,
      phone: schema.leads.phone,
      eventType: schema.leads.eventType,
      guestCount: schema.leads.guestCount,
      messageId: schema.messages.id,
      direction: schema.messages.direction,
      body: schema.messages.body,
      aiDraft: schema.messages.aiDraft,
      createdAt: schema.messages.createdAt,
    })
    .from(schema.conversations)
    .leftJoin(schema.leads, eq(schema.conversations.leadId, schema.leads.id))
    .innerJoin(
      schema.messages,
      eq(schema.messages.conversationId, schema.conversations.id),
    )
    .where(eq(schema.conversations.organizationId, orgId))
    .orderBy(asc(schema.messages.createdAt));

  const byConvo = new Map<string, Thread>();
  for (const r of rows) {
    let t = byConvo.get(r.conversationId);
    if (!t) {
      const couple = r.coupleName ?? "Enquiry";
      const context =
        r.guestCount != null
          ? `${EVENT_TYPE_LABELS[r.eventType ?? ""] ?? r.eventType ?? "Event"} · ${r.guestCount} guests`
          : undefined;
      t = {
        id: r.conversationId,
        conversationId: r.conversationId,
        couple,
        initials: initialsOf(couple),
        phone: r.phone ?? undefined,
        channel: r.channel,
        context,
        unread: 0,
        messages: [],
      };
      byConvo.set(r.conversationId, t);
    }
    const at = new Date(r.createdAt).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    t.messages.push({
      id: r.messageId,
      direction: r.direction,
      body: r.body ?? "",
      at,
      aiDraft: r.aiDraft ?? undefined,
    });
  }

  // Unread = inbound messages that still carry an unanswered AI draft.
  for (const t of byConvo.values()) {
    const last = t.messages[t.messages.length - 1];
    t.unread = last && last.direction === "in" ? 1 : 0;
  }
  return [...byConvo.values()];
}

export default async function MessagesPage() {
  const org = await getActiveOrg();
  let threads: Thread[] = [];
  if (org) {
    try {
      threads = await liveThreads(org.id);
    } catch {
      threads = [];
    }
  }
  const isDemo = !org || threads.length === 0;
  if (isDemo) threads = demoThreads();

  const venue = org?.name ?? DEMO_VENUE.name;
  const openCount = threads.filter((t) => t.unread > 0).length;
  const draftCount = threads.reduce(
    (n, t) => n + t.messages.filter((m) => m.aiDraft).length,
    0,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Messages"
        description={
          isDemo
            ? "Demo inbox — every enquiry comes with an AI-drafted reply you can edit and send."
            : "Unified inbox with AI-drafted replies."
        }
        action={
          <Badge
            variant="secondary"
            className="gap-1.5 bg-primary/10 px-2.5 py-1 text-primary"
          >
            <Sparkles className="size-3.5" />
            {anthropicConfigured ? "AI replies live" : "AI replies (demo)"}
            <span aria-hidden className="opacity-50">
              ·
            </span>
            <Languages className="size-3.5" /> EN / HI
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={MessageSquare}
          label="Open conversations"
          value={openCount}
          hint="need a reply"
        />
        <Stat
          icon={Sparkles}
          label="AI replies ready"
          value={draftCount}
          hint="review & send"
        />
        <Stat
          icon={Timer}
          label="Avg first response"
          value="8 min"
          hint="target < 5 min"
        />
      </div>

      <Inbox threads={threads} venue={venue} />

      <p className="text-center text-xs text-muted-foreground">
        Every reply is human-in-the-loop — AI drafts, you review and send.{" "}
        {anthropicConfigured
          ? "Drafts are generated live by Claude."
          : "Connect an Anthropic key to draft live; demo uses curated suggestions."}
      </p>
    </div>
  );
}
