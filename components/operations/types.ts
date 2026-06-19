/**
 * Shared shapes for the Operations slice (events + media). Kept inside the
 * owned folder so the client board, the page, and the server actions all agree
 * on the data contract — and so a real DB row and a demo row look identical to
 * the UI.
 */

export type ChecklistItem = { label: string; done: boolean };
export type TimelineItem = { time: string; item: string };

/** A single dish the team can mark as selected for the event. */
export type MenuItem = { label: string; selected: boolean };
/** Menu organised by course (Welcome drinks, Starters, Mains, …). */
export type MenuCourse = { course: string; items: MenuItem[] };

/** One row of the rooming list — who stays where, for how many nights. */
export type RoomingRow = {
  guest: string;
  roomType: string;
  nights: number;
  checkIn: string;
};

/** A vendor slotted into the event (photographer, caterer, décor, …). */
export type VendorAssignment = {
  vendorId: string;
  name: string;
  category: string;
  role: string;
};

/** A vendor the venue can pick from when staffing an event. */
export type VendorOption = {
  id: string;
  name: string;
  category: string;
  preferred: boolean;
};

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
  /** Menu selections grouped by course (lives inside the `menu` jsonb blob). */
  menuCourses: MenuCourse[];
  /** Rooming list (lives inside the `roomingList` jsonb blob). */
  rooming: RoomingRow[];
  /** Vendors assigned to this event (lives inside the `menu` jsonb blob). */
  vendors: VendorAssignment[];
  menuNotes: string;
  decorNotes: string;
  daySheetUrl: string | null;
  /** True when this is demo data (no live DB) — saves are blocked with a hint. */
  isDemo: boolean;
};
