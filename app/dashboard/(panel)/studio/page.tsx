import { eq } from "drizzle-orm";
import { ImageIcon, Sparkles, Tags, Wand2 } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Stat } from "@/components/dashboard/stat";
import { ContentStudio } from "@/components/studio/content-studio";
import {
  MediaLibrary,
  type MediaLibraryItem,
} from "@/components/studio/media-library";
import { Card, CardContent } from "@/components/ui/card";
import { anthropicConfigured } from "@/lib/ai/claude";
import { getDb, schema } from "@/lib/db";
import { DEMO_MEDIA, DEMO_VENUE } from "@/lib/demo-data";
import { getActiveOrg } from "@/lib/org";

async function loadMedia(orgId: string): Promise<MediaLibraryItem[]> {
  const rows = await getDb()
    .select({
      category: schema.mediaAssets.category,
      aiTags: schema.mediaAssets.aiTags,
    })
    .from(schema.mediaAssets)
    .where(eq(schema.mediaAssets.organizationId, orgId));
  return rows.map((r) => ({ category: r.category, aiTags: r.aiTags ?? [] }));
}

export default async function StudioPage() {
  const org = await getActiveOrg();
  const media: MediaLibraryItem[] = org
    ? await loadMedia(org.id)
    : DEMO_MEDIA.map((m) => ({ category: m.category, aiTags: m.aiTags }));

  const taggedShots = media.filter((m) => m.aiTags.length > 0).length;
  const tagCount = new Set(media.flatMap((m) => m.aiTags)).size;
  const aiLive = anthropicConfigured;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Content Studio"
        description={
          org
            ? "Turn your photo pack into ready-to-post captions, hashtags, and reel scripts — in seconds."
            : `Demo studio for ${DEMO_VENUE.name}. Generate on-brand social content from your media library.`
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={ImageIcon}
          label="Source photos"
          value={media.length}
          hint="in your library"
        />
        <Stat
          icon={Tags}
          label="AI tags applied"
          value={tagCount}
          hint={`${taggedShots} shots tagged`}
        />
        <Stat
          icon={Sparkles}
          label="Content engine"
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
            <p className="font-medium">From photo pack to feed</p>
            <p className="mt-0.5 text-muted-foreground">
              Pick an occasion — a{" "}
              <span className="font-medium text-foreground">lawn at night</span>,
              a <span className="font-medium text-foreground">mandap setup</span>,
              or your{" "}
              <span className="font-medium text-foreground">rain-backup hall</span>{" "}
              — choose a format, and we draft a caption, hashtag sets, and a reel
              shot-list tuned for Indian wedding couples. Review, copy, post.
            </p>
          </div>
        </CardContent>
      </Card>

      <ContentStudio aiLive={aiLive} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Source library</h2>
          <span className="text-xs text-muted-foreground">
            auto-tagged on upload
          </span>
        </div>
        <MediaLibrary items={media} />
      </div>
    </div>
  );
}
