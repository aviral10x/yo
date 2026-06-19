import "dotenv/config";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

/**
 * Idempotent dev seed. Run after `pnpm db:push` with DATABASE_URL set:
 *   pnpm db:seed
 * Re-running deletes the prior demo org (cascades) and reinserts.
 * To see it in the dashboard, set this org's clerk_org_id to your Clerk org.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const db = drizzle({ client: neon(url), schema, casing: "snake_case" });

  await db
    .delete(schema.organizations)
    .where(eq(schema.organizations.name, "Rosewood Group"));

  const [org] = await db
    .insert(schema.organizations)
    .values({ name: "Rosewood Group", plan: "growth" })
    .returning();

  const [venue] = await db
    .insert(schema.venues)
    .values({
      organizationId: org.id,
      name: "Rosewood Garden",
      slug: "rosewood-garden",
      type: "resort",
      status: "published",
      city: "Jaipur",
      state: "Rajasthan",
      story:
        "A manicured destination resort blending open lawns, elegant halls, and warm Rajasthani hospitality.",
    })
    .returning();

  const spaces = await db
    .insert(schema.spaces)
    .values([
      { organizationId: org.id, venueId: venue.id, name: "The Grand Lawn", kind: "lawn", seatedCapacity: 800, floatingCapacity: 1200 },
      { organizationId: org.id, venueId: venue.id, name: "Crystal Banquet Hall", kind: "hall", seatedCapacity: 400, floatingCapacity: 600 },
    ])
    .returning();

  await db.insert(schema.packages).values([
    { organizationId: org.id, venueId: venue.id, name: "Gold", eventTypes: ["wedding"], priceMin: "1500000", priceMax: "2200000", perPlate: "1800" },
    { organizationId: org.id, venueId: venue.id, name: "Platinum", eventTypes: ["wedding"], priceMin: "2500000", priceMax: "4000000", perPlate: "2800" },
  ]);

  await db.insert(schema.leads).values([
    { organizationId: org.id, venueId: venue.id, coupleName: "Priya & Aman", phone: "+919829011111", source: "whatsapp", eventType: "wedding", guestCount: 600, stage: "new" },
    { organizationId: org.id, venueId: venue.id, coupleName: "Neha & Rohit", phone: "+919829033333", source: "wedmegood", eventType: "reception", guestCount: 300, stage: "qualified" },
    { organizationId: org.id, venueId: venue.id, coupleName: "Riya & Sameer", phone: "+919829088888", source: "direct", eventType: "wedding", guestCount: 500, stage: "confirmed" },
  ]);

  const [booking] = await db
    .insert(schema.bookings)
    .values({
      organizationId: org.id,
      venueId: venue.id,
      status: "confirmed",
      eventType: "wedding",
      eventDate: "2026-12-28",
      spaceIds: [spaces[0].id],
    })
    .returning();

  await db.insert(schema.payments).values({
    organizationId: org.id,
    bookingId: booking.id,
    type: "deposit",
    amount: "370000",
    status: "paid",
  });

  await db.insert(schema.reviews).values([
    { organizationId: org.id, venueId: venue.id, author: "Aditi Sharma", rating: 5, source: "google", text: "Stunning lawn, flawless team.", response: "Thank you Aditi!" },
    { organizationId: org.id, venueId: venue.id, author: "Rahul Mehta", rating: 5, source: "google", text: "Beautiful property, very responsive." },
  ]);

  console.log(`Seeded org ${org.id} (${venue.slug}).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
