/**
 * Demo dataset for zero-setup local development. Every Phase 1 feature follows
 * the pattern:
 *
 *   const org = await getActiveOrg();
 *   const data = org ? await loadFromDb(org.id) : DEMO_X;
 *
 * so the dashboard shows realistic data with no DATABASE_URL/Clerk, and live
 * data the moment they're connected. Dates are relative to mid-2026.
 */

export const DEMO_VENUE = {
  name: "Rosewood Garden",
  type: "resort" as const,
  city: "Jaipur",
  state: "Rajasthan",
  slug: "rosewood-garden",
};

export type DemoLead = {
  id: string;
  coupleName: string;
  phone: string;
  email?: string;
  source: "direct" | "whatsapp" | "wedmegood" | "weddingz" | "referral" | "walkin";
  eventType: "wedding" | "reception" | "sangeet" | "engagement";
  dateRequested: string;
  guestCount: number;
  stage:
    | "new"
    | "qualified"
    | "site_visit"
    | "quoted"
    | "hold"
    | "deposit"
    | "confirmed"
    | "lost";
  createdAt: string;
};

export const DEMO_LEADS: DemoLead[] = [
  { id: "ld_1", coupleName: "Priya & Aman", phone: "+91 98290 11111", source: "whatsapp", eventType: "wedding", dateRequested: "2026-12-06", guestCount: 600, stage: "new", createdAt: "2026-06-18" },
  { id: "ld_2", coupleName: "Sara & Kabir", phone: "+91 98290 22222", source: "direct", eventType: "wedding", dateRequested: "2026-11-21", guestCount: 450, stage: "new", createdAt: "2026-06-18" },
  { id: "ld_3", coupleName: "Neha & Rohit", phone: "+91 98290 33333", source: "wedmegood", eventType: "reception", dateRequested: "2026-12-14", guestCount: 300, stage: "qualified", createdAt: "2026-06-17" },
  { id: "ld_4", coupleName: "Anjali & Vikram", phone: "+91 98290 44444", source: "referral", eventType: "wedding", dateRequested: "2027-02-08", guestCount: 800, stage: "site_visit", createdAt: "2026-06-15" },
  { id: "ld_5", coupleName: "Meera & Arjun", phone: "+91 98290 55555", source: "weddingz", eventType: "sangeet", dateRequested: "2026-11-30", guestCount: 250, stage: "quoted", createdAt: "2026-06-14" },
  { id: "ld_6", coupleName: "Tanya & Dev", phone: "+91 98290 66666", source: "direct", eventType: "wedding", dateRequested: "2026-12-20", guestCount: 550, stage: "hold", createdAt: "2026-06-12" },
  { id: "ld_7", coupleName: "Ishita & Karan", phone: "+91 98290 77777", source: "whatsapp", eventType: "wedding", dateRequested: "2027-01-18", guestCount: 700, stage: "deposit", createdAt: "2026-06-10" },
  { id: "ld_8", coupleName: "Riya & Sameer", phone: "+91 98290 88888", source: "direct", eventType: "wedding", dateRequested: "2026-12-28", guestCount: 500, stage: "confirmed", createdAt: "2026-06-05" },
  { id: "ld_9", coupleName: "Pooja & Nikhil", phone: "+91 98290 99999", source: "wedmegood", eventType: "engagement", dateRequested: "2026-10-12", guestCount: 150, stage: "lost", createdAt: "2026-06-02" },
];

export const DEMO_PIPELINE: { stage: DemoLead["stage"]; count: number }[] = [
  { stage: "new", count: 2 },
  { stage: "qualified", count: 1 },
  { stage: "site_visit", count: 1 },
  { stage: "quoted", count: 1 },
  { stage: "hold", count: 1 },
  { stage: "deposit", count: 1 },
  { stage: "confirmed", count: 1 },
  { stage: "lost", count: 1 },
];

export const DEMO_METRICS = {
  firstResponse: "8 min",
  leadToVisit: "42%",
  visitToDeposit: "61%",
  directShare: "55%",
};

export const DEMO_SPACES = [
  { id: "sp_1", name: "The Grand Lawn", kind: "lawn", seated: 800, floating: 1200 },
  { id: "sp_2", name: "Crystal Banquet Hall", kind: "hall", seated: 400, floating: 600 },
  { id: "sp_3", name: "Poolside Deck", kind: "lawn", seated: 200, floating: 300 },
];

export const DEMO_PACKAGES = [
  { id: "pk_1", name: "Silver", eventTypes: ["wedding"], priceMin: 800000, priceMax: 1200000, perPlate: 1200 },
  { id: "pk_2", name: "Gold", eventTypes: ["wedding", "reception"], priceMin: 1500000, priceMax: 2200000, perPlate: 1800 },
  { id: "pk_3", name: "Platinum", eventTypes: ["wedding"], priceMin: 2500000, priceMax: 4000000, perPlate: 2800 },
];

/** Occupied dates for the availability calendar (per space). */
export const DEMO_CALENDAR: { date: string; spaceId: string; kind: "hold" | "confirmed" | "blackout" }[] = [
  { date: "2026-12-20", spaceId: "sp_1", kind: "hold" },
  { date: "2026-12-28", spaceId: "sp_1", kind: "confirmed" },
  { date: "2027-01-18", spaceId: "sp_2", kind: "confirmed" },
  { date: "2026-11-15", spaceId: "sp_1", kind: "blackout" },
];

export const DEMO_BOOKINGS = [
  { id: "bk_1", coupleName: "Riya & Sameer", eventDate: "2026-12-28", status: "confirmed", space: "The Grand Lawn", amount: 1850000 },
  { id: "bk_2", coupleName: "Ishita & Karan", eventDate: "2027-01-18", status: "deposit", space: "Crystal Banquet Hall", amount: 2100000 },
  { id: "bk_3", coupleName: "Tanya & Dev", eventDate: "2026-12-20", status: "provisional", space: "The Grand Lawn", amount: 1600000 },
];

export const DEMO_PAYMENTS = [
  { id: "pm_1", couple: "Riya & Sameer", type: "deposit", amount: 370000, status: "paid", dueDate: "2026-06-05" },
  { id: "pm_2", couple: "Ishita & Karan", type: "deposit", amount: 420000, status: "paid", dueDate: "2026-06-10" },
  { id: "pm_3", couple: "Riya & Sameer", type: "installment", amount: 740000, status: "pending", dueDate: "2026-10-28" },
];

export const DEMO_REVIEWS = [
  { id: "rv_1", author: "Aditi Sharma", rating: 5, source: "google", text: "Stunning lawn and the team handled everything flawlessly.", response: "Thank you Aditi! It was a joy hosting your big day." },
  { id: "rv_2", author: "Rahul Mehta", rating: 5, source: "google", text: "Beautiful property, great food, very responsive.", response: undefined },
  { id: "rv_3", author: "Sneha Gupta", rating: 4, source: "direct", text: "Lovely venue, parking could be better.", response: undefined },
];

export const DEMO_EVENTS = [
  { id: "ev_1", coupleName: "Riya & Sameer", eventDate: "2026-12-28", checklistDone: 6, checklistTotal: 10 },
  { id: "ev_2", coupleName: "Ishita & Karan", eventDate: "2027-01-18", checklistDone: 2, checklistTotal: 10 },
];

export const DEMO_VENDORS = [
  { id: "vn_1", name: "Lens & Light Studio", category: "photographer", preferred: true },
  { id: "vn_2", name: "Maharaja Caterers", category: "caterer", preferred: true },
  { id: "vn_3", name: "Bloom Decor", category: "decorator", preferred: false },
];

export const DEMO_MEDIA = [
  { id: "md_1", category: "entrance", aiTags: ["entrance", "gate", "daylight"] },
  { id: "md_2", category: "stage", aiTags: ["mandap", "stage", "floral"] },
  { id: "md_3", category: "lighting", aiTags: ["night lighting", "fairy lights"] },
  { id: "md_4", category: "rain_backup", aiTags: ["rain backup hall", "indoor"] },
];

export const DEMO_MESSAGES = [
  { id: "ms_1", couple: "Priya & Aman", direction: "in" as const, body: "Hi, is 6 Dec available for 600 guests?", aiDraft: "Namaste! Haan ji, 6 December is available on The Grand Lawn (up to 1200). Our Gold package suits 600 guests — shall I share details and book a site visit?" },
  { id: "ms_2", couple: "Sara & Kabir", direction: "in" as const, body: "What's your per plate for veg?", aiDraft: "Hi Sara! Our veg menus start at ₹1,200/plate (Silver) and ₹1,800/plate (Gold). Want me to send sample menus?" },
];

// ---- Phase 2 demo data --------------------------------------------------

/** Room inventory (for resorts/farmhouses on the Growth plan). */
export const DEMO_ROOMS = [
  { id: "rm_1", name: "Garden View Rooms", kind: "room_block", count: 24, tariff: 6500 },
  { id: "rm_2", name: "Premium Suites", kind: "room_block", count: 6, tariff: 12000 },
  { id: "rm_3", name: "Cottages", kind: "room_block", count: 8, tariff: 9000 },
];

/** Analytics dashboard demo (the PMF metrics, funnel, sources, revenue). */
export const DEMO_ANALYTICS = {
  funnel: [
    { stage: "Enquiries", count: 84 },
    { stage: "Qualified", count: 52 },
    { stage: "Site visits", count: 31 },
    { stage: "Quotes", count: 22 },
    { stage: "Deposits", count: 14 },
    { stage: "Confirmed", count: 11 },
  ],
  monthly: [
    { month: "Jan", enquiries: 9, bookings: 2 },
    { month: "Feb", enquiries: 12, bookings: 3 },
    { month: "Mar", enquiries: 11, bookings: 2 },
    { month: "Apr", enquiries: 15, bookings: 4 },
    { month: "May", enquiries: 18, bookings: 5 },
    { month: "Jun", enquiries: 19, bookings: 6 },
  ],
  bySource: [
    { source: "Direct", value: 38 },
    { source: "WhatsApp", value: 24 },
    { source: "WedMeGood", value: 18 },
    { source: "Referral", value: 12 },
    { source: "Weddingz", value: 8 },
  ],
  revenue: [
    { month: "Jan", value: 1800000 },
    { month: "Feb", value: 3200000 },
    { month: "Mar", value: 2100000 },
    { month: "Apr", value: 4400000 },
    { month: "May", value: 5200000 },
    { month: "Jun", value: 6100000 },
  ],
};

// ---- Phase 3 demo data (Intelligence + Portfolio) -----------------------

/** AI lead/enquiry scoring. */
export const DEMO_LEAD_SCORES = [
  { id: "ld_4", coupleName: "Anjali & Vikram", score: 92, tier: "hot" as const, reasons: ["800 guests — high value", "Referral source", "Site visit completed", "Feb peak date"] },
  { id: "ld_7", coupleName: "Ishita & Karan", score: 88, tier: "hot" as const, reasons: ["700 guests", "Reached deposit stage", "Very responsive on WhatsApp"] },
  { id: "ld_3", coupleName: "Neha & Rohit", score: 64, tier: "warm" as const, reasons: ["300 guests", "Marketplace lead", "Not yet visited"] },
  { id: "ld_1", coupleName: "Priya & Aman", score: 58, tier: "warm" as const, reasons: ["600 guests", "New enquiry", "Peak date requested"] },
  { id: "ld_9", coupleName: "Pooja & Nikhil", score: 28, tier: "cold" as const, reasons: ["150 guests — low value", "Off-season", "Went quiet 10 days"] },
];

/** AI price recommendations by event type + season. */
export const DEMO_PRICE_RECS = [
  { eventType: "Wedding", season: "Peak (Nov–Feb)", current: 1500000, suggested: 1850000, change: 23, rationale: "Saturdays in your peak window are ~80% booked — raise to capture demand." },
  { eventType: "Wedding", season: "Off-peak (Jun–Sep)", current: 1500000, suggested: 1250000, change: -17, rationale: "Low occupancy — a monsoon package fills otherwise-empty dates." },
  { eventType: "Reception", season: "Peak", current: 800000, suggested: 950000, change: 19, rationale: "Strong reception demand; keep weekday discounts to stay competitive." },
];

/** Date-demand heat map: demand intensity 0–100 per upcoming month. */
export const DEMO_DEMAND = [
  { month: "Jul 2026", demand: 35 },
  { month: "Aug 2026", demand: 28 },
  { month: "Sep 2026", demand: 40 },
  { month: "Oct 2026", demand: 72 },
  { month: "Nov 2026", demand: 95 },
  { month: "Dec 2026", demand: 98 },
  { month: "Jan 2027", demand: 90 },
  { month: "Feb 2027", demand: 88 },
  { month: "Mar 2027", demand: 55 },
];

/** Portfolio: properties for owners with multiple venues. */
export const DEMO_PROPERTIES = [
  { id: "v1", slug: "rosewood-garden", name: "Rosewood Garden", city: "Jaipur", type: "resort", enquiries: 19, bookings: 6, occupancy: 72, revenue: 6100000 },
  { id: "v2", slug: "rosewood-banquets", name: "Rosewood Banquets", city: "Udaipur", type: "banquet", enquiries: 12, bookings: 4, occupancy: 64, revenue: 3200000 },
  { id: "v3", slug: "rosewood-farm", name: "Rosewood Farm", city: "Jaipur", type: "farmhouse", enquiries: 8, bookings: 2, occupancy: 41, revenue: 1500000 },
];

/** Team members + roles. */
export const DEMO_TEAM = [
  { id: "u1", name: "Aviral Gupta", email: "owner@rosewood.in", role: "owner" as const, lastActive: "Just now" },
  { id: "u2", name: "Sunita Rao", email: "sunita@rosewood.in", role: "manager" as const, lastActive: "2h ago" },
  { id: "u3", name: "Imran Khan", email: "imran@rosewood.in", role: "staff" as const, lastActive: "Yesterday" },
];

// ---- Phase 4 demo data (Marketplace) ------------------------------------

/** Couple-facing discovery marketplace listings. */
export const DEMO_DISCOVERY_VENUES = [
  { slug: "rosewood-garden", name: "Rosewood Garden", city: "Jaipur", state: "Rajasthan", type: "resort", capacity: 1200, priceFrom: 1500000, rating: 4.9, reviews: 128, image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80&auto=format&fit=crop" },
  { slug: "lily-lawns", name: "Lily Lawns", city: "Jaipur", state: "Rajasthan", type: "lawn", capacity: 800, priceFrom: 700000, rating: 4.7, reviews: 86, image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80&auto=format&fit=crop" },
  { slug: "lake-pavilion", name: "Lake Pavilion", city: "Udaipur", state: "Rajasthan", type: "resort", capacity: 600, priceFrom: 2500000, rating: 5.0, reviews: 64, image: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop" },
  { slug: "the-grand-hall", name: "The Grand Hall", city: "Delhi", state: "Delhi", type: "banquet", capacity: 500, priceFrom: 900000, rating: 4.6, reviews: 142, image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&q=80&auto=format&fit=crop" },
  { slug: "palm-grove-farm", name: "Palm Grove Farmhouse", city: "Gurugram", state: "Haryana", type: "farmhouse", capacity: 700, priceFrom: 650000, rating: 4.5, reviews: 53, image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80&auto=format&fit=crop" },
  { slug: "seaside-resort", name: "Seaside Resort", city: "Goa", state: "Goa", type: "resort", capacity: 400, priceFrom: 1800000, rating: 4.8, reviews: 97, image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80&auto=format&fit=crop" },
];

/** A raw pasted marketplace enquiry, for the AI lead-import parser demo. */
export const DEMO_IMPORT_SAMPLE = `New enquiry — WedMeGood
Name: Kavya & Arnav
Phone: +91 90000 12345
Email: kavya@example.com
Event: Wedding
Date: 12 Dec 2026
Guests: 550
City: Jaipur
Message: Looking for a lawn with rooms for outstation guests.`;
