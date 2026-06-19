import { BedDouble, LayoutGrid, MapPin, Package, Users } from "lucide-react";
import { asc, eq } from "drizzle-orm";

import { PageHeader } from "@/components/dashboard/page-header";
import { Stat } from "@/components/dashboard/stat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpacesTable } from "@/components/inventory/spaces-table";
import { RoomsTable } from "@/components/inventory/rooms-table";
import { PackagesGrid } from "@/components/inventory/packages-grid";
import {
  type PackageRow,
  type RoomRow,
  type SpaceRow,
} from "@/components/inventory/inventory-types";
import {
  DEMO_PACKAGES,
  DEMO_ROOMS,
  DEMO_SPACES,
} from "@/lib/demo-data";
import { getDb, schema } from "@/lib/db";
import { getActiveOrg } from "@/lib/org";

/** Tariff is encoded in a room_block space's `notes` as "tariff:<amount>". */
const TARIFF_PREFIX = "tariff:";

function parseTariff(notes: string | null): number {
  if (!notes?.startsWith(TARIFF_PREFIX)) return 0;
  const n = Number(notes.slice(TARIFF_PREFIX.length));
  return Number.isFinite(n) ? n : 0;
}

function toNum(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

type InventoryData = {
  spaces: SpaceRow[];
  rooms: RoomRow[];
  packages: PackageRow[];
  liveDb: boolean;
};

async function loadInventory(): Promise<InventoryData> {
  const org = await getActiveOrg();

  if (!org) {
    return {
      liveDb: false,
      spaces: DEMO_SPACES.map((s) => ({
        id: s.id,
        name: s.name,
        kind: s.kind as SpaceRow["kind"],
        seatedCapacity: s.seated,
        floatingCapacity: s.floating,
        notes: null,
      })),
      rooms: DEMO_ROOMS.map((r) => ({
        id: r.id,
        name: r.name,
        count: r.count,
        tariff: r.tariff,
      })),
      packages: DEMO_PACKAGES.map((p) => ({
        id: p.id,
        name: p.name,
        eventTypes: p.eventTypes,
        inclusions: [],
        priceMin: p.priceMin,
        priceMax: p.priceMax,
        perPlate: p.perPlate,
        active: true,
      })),
    };
  }

  const db = getDb();

  const [spaceRows, packageRows] = await Promise.all([
    db
      .select()
      .from(schema.spaces)
      .where(eq(schema.spaces.organizationId, org.id))
      .orderBy(asc(schema.spaces.name)),
    db
      .select()
      .from(schema.packages)
      .where(eq(schema.packages.organizationId, org.id))
      .orderBy(asc(schema.packages.name)),
  ]);

  // Room blocks share the spaces table (kind='room_block'); split them out.
  const spaces: SpaceRow[] = [];
  const rooms: RoomRow[] = [];
  for (const s of spaceRows) {
    if (s.kind === "room_block") {
      rooms.push({
        id: s.id,
        name: s.name,
        count: s.roomCount ?? 0,
        tariff: parseTariff(s.notes),
      });
    } else {
      spaces.push({
        id: s.id,
        name: s.name,
        kind: s.kind as SpaceRow["kind"],
        seatedCapacity: s.seatedCapacity,
        floatingCapacity: s.floatingCapacity,
        notes: s.notes,
      });
    }
  }

  const packages: PackageRow[] = packageRows.map((p) => ({
    id: p.id,
    name: p.name,
    eventTypes: p.eventTypes ?? [],
    inclusions: p.inclusions ?? [],
    priceMin: toNum(p.priceMin),
    priceMax: toNum(p.priceMax),
    perPlate: toNum(p.perPlate),
    active: p.active,
  }));

  return { liveDb: true, spaces, rooms, packages };
}

export default async function InventoryPage() {
  const { spaces, rooms, packages, liveDb } = await loadInventory();

  // Headline guest capacity = max seated across spaces (what you can quote one
  // event for), plus total floating reach as the hint.
  const maxSeated = spaces.reduce(
    (m, s) => Math.max(m, s.seatedCapacity ?? 0),
    0,
  );
  const totalFloating = spaces.reduce(
    (sum, s) => sum + (s.floatingCapacity ?? 0),
    0,
  );
  const totalRooms = rooms.reduce((sum, r) => sum + (r.count || 0), 0);
  const activePackages = packages.filter((p) => p.active).length;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Inventory"
        description={
          liveDb
            ? "Spaces, room blocks, and packages — what you sell and how much fits."
            : "Showing demo inventory. Connect a database to manage your own."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Users}
          label="Largest seated"
          value={maxSeated ? maxSeated.toLocaleString("en-IN") : "—"}
          hint={
            totalFloating
              ? `${totalFloating.toLocaleString("en-IN")} floating reach`
              : "per event"
          }
        />
        <Stat
          icon={MapPin}
          label="Spaces"
          value={spaces.length}
          hint="lawns & halls"
        />
        <Stat
          icon={BedDouble}
          label="Rooms"
          value={totalRooms}
          hint={`${rooms.length} block${rooms.length === 1 ? "" : "s"}`}
        />
        <Stat
          icon={Package}
          label="Packages"
          value={packages.length}
          hint={`${activePackages} live`}
        />
      </div>

      <Tabs defaultValue="spaces">
        <TabsList>
          <TabsTrigger value="spaces">
            <MapPin className="size-4" />
            Spaces
          </TabsTrigger>
          <TabsTrigger value="rooms">
            <BedDouble className="size-4" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="packages">
            <LayoutGrid className="size-4" />
            Packages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spaces" className="mt-4">
          <SpacesTable spaces={spaces} liveDb={liveDb} />
        </TabsContent>

        <TabsContent value="rooms" className="mt-4">
          <RoomsTable rooms={rooms} liveDb={liveDb} />
        </TabsContent>

        <TabsContent value="packages" className="mt-4">
          <PackagesGrid packages={packages} liveDb={liveDb} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
