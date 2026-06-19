import Razorpay from "razorpay";

export const razorpayConfigured = !!(
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
);

let _client: Razorpay | undefined;

/** Lazily-constructed Razorpay client. key_secret is server-only; only
 *  NEXT_PUBLIC_RAZORPAY_KEY_ID is safe in the browser. */
export function getRazorpay(): Razorpay {
  if (!_client) {
    if (!razorpayConfigured) throw new Error("Razorpay is not configured");
    _client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return _client;
}
