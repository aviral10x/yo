import { Hammer } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function SectionPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Hammer className="size-6" />
          </span>
          <p className="font-medium">Scaffolded — builds in Phase 1</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            The route, data model, and navigation are wired. This feature is
            implemented in a later phase per the plan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
