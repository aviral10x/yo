import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-[18px]" />
          </span>
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
        <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
