import { and, eq, gte, sql } from "drizzle-orm";
import { Download, Inbox, Plug, Sparkles, Wand2 } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Stat } from "@/components/dashboard/stat";
import { ConnectorsPanel } from "@/components/imports/connectors-panel";
import { ImportParser } from "@/components/imports/import-parser";
import { CONNECTORS } from "@/components/imports/import-types";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { anthropicConfigured } from "@/lib/ai/claude";
import { getDb, schema } from "@/lib/db";
import { DEMO_IMPORT_SAMPLE, DEMO_VENUE } from "@/lib/demo-data";
import { getActiveOrg } from "@/lib/org";

/** Count leads imported this calendar month from the activity stream. */
async function importedThisMonth(orgId: string): Promise<number> {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  try {
    const [row] = await getDb()
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.activityEvents)
      .where(
        and(
          eq(schema.activityEvents.organizationId, orgId),
          eq(schema.activityEvents.type, "lead.imported"),
          gte(schema.activityEvents.createdAt, start),
        ),
      );
    return row?.n ?? 0;
  } catch {
    return 0;
  }
}

export default async function ImportsPage() {
  const org = await getActiveOrg();
  // Demo: a believable "imported this month" so the showpiece isn't a flat zero.
  const imported = org ? await importedThisMonth(org.id) : 7;
  const aiLive = anthropicConfigured;

  // Connectors are stubs in this phase — none are live yet.
  const connected = 0;
  const totalConnectors = CONNECTORS.length + 1; // + email forwarding

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Imports"
        description={
          org
            ? "Pull marketplace enquiries into one pipeline — paste, parse, and import in seconds."
            : `Demo importer for ${DEMO_VENUE.name}. Paste a marketplace enquiry and watch it become a lead.`
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={Download}
          label="Imported this month"
          value={imported}
          hint="into your pipeline"
        />
        <Stat
          icon={Plug}
          label="Sources connected"
          value={`${connected}/${totalConnectors}`}
          hint="marketplaces + email"
        />
        <Stat
          icon={Sparkles}
          label="Parser"
          value={aiLive ? "Live AI" : "Demo"}
          hint={aiLive ? "Claude on" : "templated"}
        />
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Wand2 className="size-[18px]" />
          </span>
          <div className="text-sm">
            <p className="font-medium">One inbox for every marketplace</p>
            <p className="mt-0.5 text-muted-foreground">
              Stop re-typing enquiries from{" "}
              <span className="font-medium text-foreground">WedMeGood</span>,{" "}
              <span className="font-medium text-foreground">Weddingz</span>, and{" "}
              <span className="font-medium text-foreground">VenueLook</span>.
              Paste the raw enquiry — we extract the couple, date, guests, and
              source, then drop a clean lead into your pipeline. Duplicates are
              caught by phone.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="import" className="gap-6">
        <TabsList>
          <TabsTrigger value="import">
            <Inbox className="size-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="connectors">
            <Plug className="size-4" />
            Connectors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <ImportParser sample={DEMO_IMPORT_SAMPLE} aiLive={aiLive} />
        </TabsContent>

        <TabsContent value="connectors">
          <ConnectorsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
