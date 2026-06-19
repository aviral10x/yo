/**
 * Shared shapes for the Operations slice (events + media). Kept inside the
 * owned folder so the client board, the page, and the server actions all agree
 * on the data contract — and so a real DB row and a demo row look identical to
 * the UI.
 */

export type ChecklistItem = { label: string; done: boolean };
export type TimelineItem = { time: string; item: string };

export type EventDetail = {
  id: string;
  bookingId: string | null;
  coupleName: string;
  eventType: string;
  eventDate: string;
  spaceName: string | null;
  guestCount: number | null;
  checklist: ChecklistItem[];
  timeline: TimelineItem[];
  menuNotes: string;
  decorNotes: string;
  daySheetUrl: string | null;
  /** True when this is a placeholder for a confirmed booking with no event row yet. */
  isDemo: boolean;
};
