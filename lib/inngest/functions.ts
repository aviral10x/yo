import { inngest } from "./client";

// Event-driven: AI follow-up nudge after an enquiry goes quiet. Trigger with:
//   await inngest.send({ name: "lead/created", data: { leadId } })
export const sendLeadFollowUp = inngest.createFunction(
  { id: "send-lead-follow-up", triggers: [{ event: "lead/created" }] },
  async ({ event, step }) => {
    const { leadId } = event.data as { leadId: string };

    // Durable delay — survives restarts/redeploys without holding a connection.
    await step.sleep("wait-1-day", "1d");

    return step.run("draft-and-send-followup", async () => {
      // Phase 1: draft via Claude + send over WhatsApp/email if still un-quoted.
      return { leadId, sent: true };
    });
  },
);

// Scheduled (cron): release provisional holds whose TTL has expired. v4 uses the
// `triggers` array form; cron supports a TZ prefix.
export const releaseExpiredHolds = inngest.createFunction(
  { id: "release-expired-holds", triggers: [{ cron: "TZ=Asia/Kolkata 0 2 * * *" }] },
  async ({ step }) => {
    return step.run("release-holds", async () => {
      // Phase 1: find calendar_blocks(kind='hold') past holdExpiresAt → release.
      return { released: 0 };
    });
  },
);
