import { Globe, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";

const SOURCE_META: Record<
  string,
  { label: string; icon: typeof Globe; className: string }
> = {
  google: {
    label: "Google",
    icon: MapPin,
    className:
      "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  direct: {
    label: "Direct",
    icon: Globe,
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
};

export function SourceBadge({ source }: { source: string }) {
  const meta = SOURCE_META[source] ?? SOURCE_META.direct;
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={meta.className}>
      <Icon className="size-3" />
      {meta.label}
    </Badge>
  );
}
