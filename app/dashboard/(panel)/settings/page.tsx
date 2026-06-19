import { eq } from "drizzle-orm";

import { PageHeader } from "@/components/dashboard/page-header";
import { BillingPanel } from "@/components/settings/billing-panel";
import { IntegrationsPanel } from "@/components/settings/integrations-panel";
import { TeamPanel, type TeamMember } from "@/components/settings/team-panel";
import { VenueForm, type VenueDefaults } from "@/components/settings/venue-form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDb, schema } from "@/lib/db";
import { DEMO_VENUE } from "@/lib/demo-data";
import { getActiveOrg } from "@/lib/org";
import { PLAN_META, type Plan } from "@/lib/plans";

const DEMO_TEAM: TeamMember[] = [
  {
    name: "Rohan Kapoor",
    email: "rohan@rosewoodgarden.in",
    role: "owner",
    you: true,
  },
  {
    name: "Anita Desai",
    email: "anita@rosewoodgarden.in",
    role: "manager",
  },
];

export default async function SettingsPage() {
  const org = await getActiveOrg();

  let venueDefaults: VenueDefaults = {
    name: DEMO_VENUE.name,
    type: DEMO_VENUE.type,
    city: DEMO_VENUE.city,
    state: DEMO_VENUE.state,
  };
  // Demo highlights Growth as the current plan per the brief.
  let plan: Plan = "growth";

  if (org) {
    plan = org.plan;
    const [venue] = await getDb()
      .select({
        name: schema.venues.name,
        type: schema.venues.type,
        city: schema.venues.city,
        state: schema.venues.state,
      })
      .from(schema.venues)
      .where(eq(schema.venues.organizationId, org.id))
      .limit(1);
    if (venue) {
      venueDefaults = {
        name: venue.name,
        type: venue.type,
        city: venue.city ?? "",
        state: venue.state ?? "",
      };
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Settings"
        description="Venue details, team & roles, plan and billing, and integrations."
        action={
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-primary"
          >
            {PLAN_META[plan].label} plan
          </Badge>
        }
      />

      <Tabs defaultValue="venue" className="gap-6">
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="venue">Venue</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="billing">Plan &amp; billing</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="venue">
          <VenueForm defaults={venueDefaults} live={!!org} />
        </TabsContent>

        <TabsContent value="team">
          <TeamPanel members={DEMO_TEAM} />
        </TabsContent>

        <TabsContent value="billing">
          <BillingPanel currentPlan={plan} />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
