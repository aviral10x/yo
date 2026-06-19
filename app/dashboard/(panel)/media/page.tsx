import { CheckCircle2, ImagePlus, Sparkles, Wand2 } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Stat } from "@/components/dashboard/stat";
import { MediaPack, type MediaSlot } from "@/components/operations/media-pack";
import { Card, CardContent } from "@/components/ui/card";
import { MEDIA_PACK_CHECKLIST } from "@/lib/constants";
import { getDb, schema } from "@/lib/db";
import { DEMO_MEDIA } from "@/lib/demo-data";
import { getActiveOrg } from "@/lib/org";
import { eq } from "drizzle-orm";

type MediaRow = { category: string; aiTags: string[] };

/** Collapse media rows into a per-category map (first hit wins for tags). */
function buildSlots(media: MediaRow[]): MediaSlot[] {
  const byCategory = new Map<string, string[]>();
  for (const m of media) {
    if (!byCategory.has(m.category)) byCategory.set(m.category, m.aiTags ?? []);
  }
  return MEDIA_PACK_CHECKLIST.map((slot) => ({
    category: slot.category,
    label: slot.label,
    filled: byCategory.has(slot.category),
    aiTags: byCategory.get(slot.category) ?? [],
  }));
}

async function loadMedia(orgId: string): Promise<MediaRow[]> {
  const rows = await getDb()
    .select({
      category: schema.mediaAssets.category,
      aiTags: schema.mediaAssets.aiTags,
    })
    .from(schema.mediaAssets)
    .where(eq(schema.mediaAssets.organizationId, orgId));
  return rows.map((r) => ({ category: r.category, aiTags: r.aiTags ?? [] }));
}

export default async function MediaPage() {
  const org = await getActiveOrg();
  const media = org
    ? await loadMedia(org.id)
    : DEMO_MEDIA.map((m) => ({ category: m.category, aiTags: m.aiTags }));

  const slots = buildSlots(media);
  const filled = slots.filter((s) => s.filled).length;
  const total = slots.length;
  const pct = total ? Math.round((filled / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Media"
        description={
          org
            ? "Your standardized venue photo pack — one consistent set every listing and proposal pulls from."
            : "Showing the demo photo pack. Connect a database to upload your own."
        }
      />

      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            icon={CheckCircle2}
            label="Pack completeness"
            value={`${pct}%`}
            hint={`${filled}/${total} slots`}
          />
          <Stat
            icon={ImagePlus}
            label="Photos on file"
            value={filled}
            hint="across categories"
          />
          <Stat
            icon={Sparkles}
            label="Missing slots"
            value={total - filled}
            hint="to complete the pack"
          />
        </div>

        {/* AI auto-tag explainer */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Wand2 className="size-[18px]" />
            </span>
            <div className="text-sm">
              <p className="font-medium">AI tags every shot — then you filter by it</p>
              <p className="mt-0.5 text-muted-foreground">
                Hit{" "}
                <span className="font-medium text-foreground">Auto-tag with AI</span>{" "}
                on any photo to label it — recognising{" "}
                <span className="font-medium text-foreground">mandap</span>,{" "}
                <span className="font-medium text-foreground">night lighting</span>,
                and{" "}
                <span className="font-medium text-foreground">rain backup</span>{" "}
                setups. Edit the chips, then filter the pack by tag so the right
                photo surfaces instantly in listings, proposals, and your website.
              </p>
            </div>
          </CardContent>
        </Card>

        <MediaPack slots={slots} liveDb={!!org} />
      </div>
    </div>
  );
}
