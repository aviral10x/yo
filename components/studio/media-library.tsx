import { ImageIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { MEDIA_PACK_CHECKLIST } from "@/lib/constants";

export type MediaLibraryItem = {
  category: string;
  aiTags: string[];
};

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  MEDIA_PACK_CHECKLIST.map((s) => [s.category, s.label]),
);

/**
 * The source library Content Studio draws from — the standardized venue photo
 * pack, surfaced with the AI tags applied at upload. Pure server-rendered grid;
 * read-only context for the studio.
 */
export function MediaLibrary({ items }: { items: MediaLibraryItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.category} className="overflow-hidden border-border/70 py-0">
          <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-primary/5">
            <ImageIcon className="size-7 text-muted-foreground/50" />
          </div>
          <CardContent className="space-y-2 px-3 py-3">
            <p className="truncate text-sm font-medium">
              {CATEGORY_LABEL[item.category] ?? item.category}
            </p>
            <div className="flex flex-wrap gap-1">
              {item.aiTags.length > 0 ? (
                item.aiTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-primary/8 px-1.5 py-0.5 text-[11px] font-medium text-primary"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  No AI tags yet
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
