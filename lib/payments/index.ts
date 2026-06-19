import "server-only";

import { getRazorpay, razorpayConfigured } from "@/lib/razorpay";

export type DepositLinkInput = {
  /** Amount to collect, in paise (smallest INR unit). e.g. ₹3,70,000 = 37000000. */
  amountPaise: number;
  /** Customer / couple name shown on the Razorpay checkout. */
  name: string;
  /** Customer contact — phone (preferred) or email. */
  contact: string;
  /** Short line describing what this deposit is for. */
  description: string;
  /** Optional idempotency / reconciliation reference (e.g. quote id). */
  referenceId?: string;
  /** Optional email to send the notification to. */
  email?: string;
};

export type DepositLinkResult = {
  /** A live Razorpay short URL, or '#' in demo mode. */
  url: string;
  /** true when no Razorpay keys are configured (no real link was created). */
  demo: boolean;
  /** Razorpay payment-link id when live, for persistence/reconciliation. */
  id?: string;
};

/**
 * Create a Razorpay deposit payment link for a proposal.
 *
 * Server-only. When Razorpay keys are present, a real short URL is created and
 * returned ({ demo:false }). Without keys we return a stub ({ url:'#', demo:true })
 * so the whole flow renders and behaves in zero-setup / demo mode.
 */
export async function createDepositLink(
  input: DepositLinkInput,
): Promise<DepositLinkResult> {
  if (!razorpayConfigured) {
    return { url: "#", demo: true };
  }

  const contact = input.contact?.replace(/\s+/g, "") || undefined;

  const link = await getRazorpay().paymentLink.create({
    amount: Math.round(input.amountPaise),
    currency: "INR",
    accept_partial: false,
    description: input.description.slice(0, 2048),
    reference_id: input.referenceId,
    customer: {
      name: input.name,
      contact,
      email: input.email,
    },
    notify: { sms: !!contact, email: !!input.email, whatsapp: !!contact },
    reminder_enable: true,
    notes: { product: "venuepilot", kind: "deposit" },
  });

  return { url: link.short_url, demo: false, id: link.id };
}
