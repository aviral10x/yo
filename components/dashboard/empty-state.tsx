import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-6" />
        </span>
        <div>
          <p className="font-medium">{title}</p>
          {description && (
            <p className="mt-0.5 max-w-sm text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
