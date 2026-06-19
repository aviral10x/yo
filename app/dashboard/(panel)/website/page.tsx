import { eq } from "drizzle-orm";
import {
  CalendarCheck,
  CircleDot,
  ExternalLink,
  Globe,
  LayoutTemplate,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Stat } from "@/components/dashboard/stat";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GbpToolkit } from "@/components/website/gbp-toolkit";
import { PublishToggle } from "@/components/website/publish-toggle";
import { WEBSITE_TEMPLATES } from "@/components/website/templates";
import { WebsiteEditor } from "@/components/website/website-editor";
import { getDb, schema } from "@/lib/db";
import { DEMO_VENUE } from "@/lib/demo-data";
import { formatDate } from "@/lib/format";
import { getActiveOrg } from "@/lib/org";
import { venueUrl } from "@/lib/urls";

type SiteData = {
  name: string;
  slug: string;
  status: "draft" | "published" | "archived";
  templateId: string;
  story: string;
  amenities: string[];
  packageNote: string;
  publishedAt: string | null;
  googlePlaceId: string | null;
};

const DEMO_SITE: SiteData = {
  name: DEMO_VENUE.name,
  slug: DEMO_VENUE.slug,
  status: "published",
  templateId: "garden",
  story:
    "Set on 12 acres of manicured gardens, Rosewood Garden has hosted over 400 weddings across Jaipur. Our flagship lawn seats 800 with a covered rain-backup hall, a dedicated bridal suite, and in-house catering trusted by families for two generations.",
  amenities: [
    "Valet parking",
    "In-house catering",
    "Bridal suite",
    "Rain backup hall",
    "DJ & sound",
    "Power backup",
    "Air-conditioned hall",
    "Pet friendly",
  ],
  packageNote:
    "Weddings from ₹8L (Silver) to ₹40L (Platinum). Per-plate ₹1,200–₹2,800. Custom packages on request.",
  publishedAt: "2026-05-21",
  googlePlaceId: null,
};

async function loadSite(orgId: string): Promise<SiteData> {
  const db = getDb();
  const [venue] = await db
    .select()
    .from(schema.venues)
    .where(eq(schema.venues.organizationId, orgId))
    .limit(1);

  if (!venue) {
    // Org exists but no venue yet — start from a clean draft scaffold.
    return {
      name: "Your venue",
      slug: DEMO_VENUE.slug,
      status: "draft",
      templateId: "classic",
      story: "",
      amenities: [],
      packageNote: "",
      publishedAt: null,
      googlePlaceId: null,
    };
  }

  const [config] = await db
    .select()
    .from(schema.websiteConfigs)
    .where(eq(schema.websiteConfigs.venueId, venue.id))
    .limit(1);

  const blocks = (config?.blocks ?? {}) as { packageNote?: string };

  return {
    name: venue.name,
    slug: venue.slug,
    status: venue.status,
    templateId: config?.templateId ?? "classic",
    story: venue.story ?? "",
    amenities: venue.amenities ?? [],
    packageNote: blocks.packageNote ?? "",
    publishedAt: config?.publishedAt
      ? config.publishedAt.toISOString()
      : null,
    googlePlaceId: venue.googlePlaceId,
  };
}

export default async function WebsitePage() {
  const org = await getActiveOrg();
  const site = org ? await loadSite(org.id) : DEMO_SITE;

  const isPublished = site.status === "published";
  const liveUrl = venueUrl(site.slug);
  const mapsUrl = site.googlePlaceId
    ? `https://www.google.com/maps/place/?q=place_id:${site.googlePlaceId}`
    : `https://www.google.com/maps/search/${encodeURIComponent(site.name)}`;
  const activeTemplate =
    WEBSITE_TEMPLATES.find((t) => t.id === site.templateId) ??
    WEBSITE_TEMPLATES[0];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Website"
        description="Your venue's public site, templates, and Google Business Profile toolkit."
        action={
          <div className="flex items-center gap-2">
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ExternalLink className="size-4" /> View live site
            </a>
            <PublishToggle published={isPublished} />
          </div>
        }
      />

      {/* Status overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/70">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CircleDot className="size-[18px]" />
              </span>
              <span
                className={
                  isPublished
                    ? "rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                    : "rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
                }
              >
                {isPublished ? "Published" : "Draft"}
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {site.name}
            </p>
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
            >
              {site.slug}.venuepilot.in <ExternalLink className="size-3" />
            </a>
          </CardContent>
        </Card>

        <Stat
          icon={LayoutTemplate}
          label="Active template"
          value={activeTemplate.name}
          hint={activeTemplate.bestFor}
        />

        <Stat
          icon={isPublished ? Globe : CalendarCheck}
          label={isPublished ? "Live since" : "Status"}
          value={
            isPublished
              ? site.publishedAt
                ? formatDate(site.publishedAt)
                : "Live"
              : "Not published"
          }
          hint={isPublished ? "indexed by Google" : "publish to go live"}
        />
      </div>

      {/* Template picker + content form */}
      <WebsiteEditor
        initial={{
          templateId: site.templateId,
          story: site.story,
          amenities: site.amenities,
          packageNote: site.packageNote,
        }}
      />

      {/* GBP toolkit */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Google Business Profile toolkit</h2>
          <p className="text-sm text-muted-foreground">
            Complete these to win the local search couples actually use.
          </p>
        </div>
        <GbpToolkit mapsUrl={mapsUrl} />
      </section>

      {/* Helper footer */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Why this matters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
          <div>
            <p className="font-medium text-foreground">Own your demand</p>
            <p className="mt-1">
              A direct site + complete GBP means leads come to you, not a
              marketplace taking a cut.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Rank where couples look</p>
            <p className="mt-1">
              12+ photos and fresh review replies are the biggest levers for
              Google Map Pack ranking.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">One source of truth</p>
            <p className="mt-1">
              Edit once here — your site, search snippet, and enquiry link all
              stay in sync.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
