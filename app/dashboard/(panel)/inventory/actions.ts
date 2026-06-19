"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { getActiveOrg } from "@/lib/org";
import { getDb, schema } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import {
  PACKAGE_EVENT_TYPES,
  SPACE_KINDS,
  type ActionState,
} from "@/components/inventory/inventory-types";

const ROUTE = "/dashboard/inventory";

const VALID_KINDS = new Set<string>(SPACE_KINDS.map((k) => k.value));
const VALID_EVENT_TYPES = new Set<string>(PACKAGE_EVENT_TYPES);

const NO_DB: ActionState = {
  ok: false,
  message: "Connect a database to save changes.",
};

function str(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : undefined;
}

/** Parse a positive integer (digits only) from a form field. */
function num(v: FormDataEntryValue | null): number | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return undefined;
  const n = Number(s.replace(/[^0-9]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * Resolve the org's primary venue id. Spaces and packages require a venueId
 * (notNull); we scope strictly to the active org and never trust a
 * client-supplied id.
 */
async function resolveVenueId(orgId: string): Promise<string | null> {
  const [venue] = await getDb()
    .select({ id: schema.venues.id })
    .from(schema.venues)
    .where(eq(schema.venues.organizationId, orgId))
    .limit(1);
  return venue?.id ?? null;
}

// ---------------------------------------------------------------------------
// Spaces
// ---------------------------------------------------------------------------

export async function createSpace(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const org = await getActiveOrg();
  if (!org) return NO_DB;

  const name = str(formData.get("name"));
  if (!name) return { ok: false, message: "Give the space a name." };

  const kind = str(formData.get("kind")) ?? "lawn";

  try {
    const venueId = await resolveVenueId(org.id);
    if (!venueId) {
      return {
        ok: false,
        message: "Add a venue first, then list spaces against it.",
      };
    }

    const [space] = await getDb()
      .insert(schema.spaces)
      .values({
        organizationId: org.id,
        venueId,
        name,
        kind: VALID_KINDS.has(kind) ? (kind as never) : "lawn",
        seatedCapacity: num(formData.get("seatedCapacity")) ?? null,
        floatingCapacity: num(formData.get("floatingCapacity")) ?? null,
        notes: str(formData.get("notes")) ?? null,
      })
      .returning({ id: schema.spaces.id });

    await logActivity({
      organizationId: org.id,
      venueId,
      type: "space.created",
      payload: { spaceId: space.id, kind },
    });

    revalidatePath(ROUTE);
    return { ok: true, message: `${name} added to your spaces.` };
  } catch {
    return { ok: false, message: "Couldn't save that space. Try again." };
  }
}

export async function updateSpace(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const org = await getActiveOrg();
  if (!org) return NO_DB;

  const id = str(formData.get("id"));
  if (!id) return { ok: false, message: "Missing space reference." };

  const name = str(formData.get("name"));
  if (!name) return { ok: false, message: "Give the space a name." };

  const kind = str(formData.get("kind")) ?? "lawn";

  try {
    const [updated] = await getDb()
      .update(schema.spaces)
      .set({
        name,
        kind: VALID_KINDS.has(kind) ? (kind as never) : "lawn",
        seatedCapacity: num(formData.get("seatedCapacity")) ?? null,
        floatingCapacity: num(formData.get("floatingCapacity")) ?? null,
        notes: str(formData.get("notes")) ?? null,
      })
      // Scope to the active org so another tenant's space can't be edited.
      .where(
        and(
          eq(schema.spaces.id, id),
          eq(schema.spaces.organizationId, org.id),
        ),
      )
      .returning({ id: schema.spaces.id, venueId: schema.spaces.venueId });

    if (!updated) return { ok: false, message: "That space no longer exists." };

    await logActivity({
      organizationId: org.id,
      venueId: updated.venueId,
      type: "space.updated",
      payload: { spaceId: id, kind },
    });

    revalidatePath(ROUTE);
    return { ok: true, message: `${name} updated.` };
  } catch {
    return { ok: false, message: "Couldn't update that space. Try again." };
  }
}

// ---------------------------------------------------------------------------
// Rooms — persisted as room_block spaces (roomCount + tariff in notes)
// ---------------------------------------------------------------------------

/**
 * Room blocks live in the same `spaces` table with kind='room_block'. The
 * nightly tariff has no dedicated column, so we encode it in `notes` as a
 * machine-readable prefix that the loader parses back out.
 */
const TARIFF_PREFIX = "tariff:";

export async function createRoom(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const org = await getActiveOrg();
  if (!org) return NO_DB;

  const name = str(formData.get("name"));
  if (!name) return { ok: false, message: "Give the room block a name." };

  const count = num(formData.get("count"));
  const tariff = num(formData.get("tariff"));

  try {
    const venueId = await resolveVenueId(org.id);
    if (!venueId) {
      return {
        ok: false,
        message: "Add a venue first, then list room blocks against it.",
      };
    }

    const [room] = await getDb()
      .insert(schema.spaces)
      .values({
        organizationId: org.id,
        venueId,
        name,
        kind: "room_block",
        roomCount: count ?? null,
        notes: tariff ? `${TARIFF_PREFIX}${tariff}` : null,
      })
      .returning({ id: schema.spaces.id });

    await logActivity({
      organizationId: org.id,
      venueId,
      type: "room_block.created",
      payload: { spaceId: room.id, count, tariff },
    });

    revalidatePath(ROUTE);
    return { ok: true, message: `${name} added to your rooms.` };
  } catch {
    return { ok: false, message: "Couldn't save that room block. Try again." };
  }
}

export async function updateRoom(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const org = await getActiveOrg();
  if (!org) return NO_DB;

  const id = str(formData.get("id"));
  if (!id) return { ok: false, message: "Missing room reference." };

  const name = str(formData.get("name"));
  if (!name) return { ok: false, message: "Give the room block a name." };

  const count = num(formData.get("count"));
  const tariff = num(formData.get("tariff"));

  try {
    const [updated] = await getDb()
      .update(schema.spaces)
      .set({
        name,
        kind: "room_block",
        roomCount: count ?? null,
        notes: tariff ? `${TARIFF_PREFIX}${tariff}` : null,
      })
      .where(
        and(
          eq(schema.spaces.id, id),
          eq(schema.spaces.organizationId, org.id),
        ),
      )
      .returning({ id: schema.spaces.id, venueId: schema.spaces.venueId });

    if (!updated) {
      return { ok: false, message: "That room block no longer exists." };
    }

    await logActivity({
      organizationId: org.id,
      venueId: updated.venueId,
      type: "room_block.updated",
      payload: { spaceId: id, count, tariff },
    });

    revalidatePath(ROUTE);
    return { ok: true, message: `${name} updated.` };
  } catch {
    return { ok: false, message: "Couldn't update that room block. Try again." };
  }
}

// ---------------------------------------------------------------------------
// Packages
// ---------------------------------------------------------------------------

function parseEventTypes(formData: FormData): string[] {
  return formData
    .getAll("eventTypes")
    .map((v) => (typeof v === "string" ? v : ""))
    .filter((v) => VALID_EVENT_TYPES.has(v));
}

function parseInclusions(formData: FormData): string[] {
  const raw = str(formData.get("inclusions")) ?? "";
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 40);
}

export async function createPackage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const org = await getActiveOrg();
  if (!org) return NO_DB;

  const name = str(formData.get("name"));
  if (!name) return { ok: false, message: "Give the package a name." };

  try {
    const venueId = await resolveVenueId(org.id);
    if (!venueId) {
      return {
        ok: false,
        message: "Add a venue first, then build packages against it.",
      };
    }

    const priceMin = num(formData.get("priceMin"));
    const priceMax = num(formData.get("priceMax"));

    const [pkg] = await getDb()
      .insert(schema.packages)
      .values({
        organizationId: org.id,
        venueId,
        name,
        eventTypes: parseEventTypes(formData),
        inclusions: parseInclusions(formData),
        priceMin: priceMin != null ? String(priceMin) : null,
        priceMax: priceMax != null ? String(priceMax) : null,
        perPlate:
          num(formData.get("perPlate")) != null
            ? String(num(formData.get("perPlate")))
            : null,
        active: true,
      })
      .returning({ id: schema.packages.id });

    await logActivity({
      organizationId: org.id,
      venueId,
      type: "package.created",
      payload: { packageId: pkg.id },
    });

    revalidatePath(ROUTE);
    return { ok: true, message: `${name} package created.` };
  } catch {
    return { ok: false, message: "Couldn't save that package. Try again." };
  }
}

export async function updatePackage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const org = await getActiveOrg();
  if (!org) return NO_DB;

  const id = str(formData.get("id"));
  if (!id) return { ok: false, message: "Missing package reference." };

  const name = str(formData.get("name"));
  if (!name) return { ok: false, message: "Give the package a name." };

  try {
    const priceMin = num(formData.get("priceMin"));
    const priceMax = num(formData.get("priceMax"));

    const [updated] = await getDb()
      .update(schema.packages)
      .set({
        name,
        eventTypes: parseEventTypes(formData),
        inclusions: parseInclusions(formData),
        priceMin: priceMin != null ? String(priceMin) : null,
        priceMax: priceMax != null ? String(priceMax) : null,
        perPlate:
          num(formData.get("perPlate")) != null
            ? String(num(formData.get("perPlate")))
            : null,
      })
      .where(
        and(
          eq(schema.packages.id, id),
          eq(schema.packages.organizationId, org.id),
        ),
      )
      .returning({ id: schema.packages.id, venueId: schema.packages.venueId });

    if (!updated) {
      return { ok: false, message: "That package no longer exists." };
    }

    await logActivity({
      organizationId: org.id,
      venueId: updated.venueId,
      type: "package.updated",
      payload: { packageId: id },
    });

    revalidatePath(ROUTE);
    return { ok: true, message: `${name} updated.` };
  } catch {
    return { ok: false, message: "Couldn't update that package. Try again." };
  }
}

export async function togglePackageActive(
  id: string,
  active: boolean,
): Promise<ActionState> {
  const org = await getActiveOrg();
  if (!org) return NO_DB;

  try {
    const [updated] = await getDb()
      .update(schema.packages)
      .set({ active })
      .where(
        and(
          eq(schema.packages.id, id),
          eq(schema.packages.organizationId, org.id),
        ),
      )
      .returning({
        id: schema.packages.id,
        name: schema.packages.name,
        venueId: schema.packages.venueId,
      });

    if (!updated) {
      return { ok: false, message: "That package no longer exists." };
    }

    await logActivity({
      organizationId: org.id,
      venueId: updated.venueId,
      type: "package.toggled",
      payload: { packageId: id, active },
    });

    revalidatePath(ROUTE);
    return {
      ok: true,
      message: `${updated.name} ${active ? "is now live" : "hidden from quotes"}.`,
    };
  } catch {
    return { ok: false, message: "Couldn't update that package. Try again." };
  }
}
