/** Shared shape for a single portfolio property row (demo + live-DB aligned). */
export type PropertyRow = {
  id: string;
  name: string;
  city: string;
  /** venueTypeEnum value: lawn | banquet | resort | farmhouse | hotel. */
  type: string;
  enquiries: number;
  bookings: number;
  /** Occupancy as a 0–100 percentage. */
  occupancy: number;
  revenue: number;
};
