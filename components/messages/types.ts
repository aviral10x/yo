/** Shared shapes for the Messages inbox. Conversations are grouped by couple. */

export type ThreadMessage = {
  id: string;
  direction: "in" | "out";
  body: string;
  /** ISO timestamp or a friendly relative label like "2m". */
  at: string;
  /** AI-suggested reply attached to an inbound message (the showpiece). */
  aiDraft?: string;
};

export type Thread = {
  id: string;
  /** Conversation id when live (drives the send action); undefined in demo. */
  conversationId?: string;
  couple: string;
  /** Two-letter initials for the avatar fallback. */
  initials: string;
  phone?: string;
  channel: "whatsapp" | "email";
  /** Enquiry context shown as chips in the thread header. */
  context?: string;
  unread: number;
  messages: ThreadMessage[];
};

export function initialsOf(name: string): string {
  const parts = name
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
