import crypto from "node:crypto";

import { NextResponse } from "next/server";

// Node.js runtime: crypto + raw body access (Edge lacks node:crypto).
export const runtime = "nodejs";

/**
 * Verify the webhook HMAC-SHA256 over the RAW body keyed by the webhook secret.
 * timingSafeEqual guards against timing attacks (and length mismatch throws, so
 * we length-check first).
 */
function verifySignature(rawBody: string, signature: string, secret: string) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  // CRITICAL: read the RAW body and verify BEFORE JSON.parse — re-serializing
  // would break the HMAC.
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as { event: string };

  // Handlers must be idempotent — Razorpay retries and may resend events.
  switch (event.event) {
    case "subscription.activated":
    case "subscription.charged":
      // grant / extend access for the org
      break;
    case "subscription.pending":
    case "subscription.halted":
      // dunning / suspend
      break;
    case "subscription.cancelled":
      // revoke access
      break;
    case "payment_link.paid":
      // deposit collected → flip provisional hold to confirmed
      break;
    default:
      break;
  }

  return NextResponse.json({ ok: true });
}
