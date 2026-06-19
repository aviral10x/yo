import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Render a 1-5 star rating. Filled stars use the warm amber tone; the
 * remaining outline sits in muted to keep the row legible.
 */
export function Stars({
  rating,
  size = 16,
  className,
}: {
  rating: number | null | undefined;
  size?: number;
  className?: string;
}) {
  const value = Math.max(0, Math.min(5, Math.round(rating ?? 0)));
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${value} out of 5 stars`}
      title={`${value} / 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < value;
        return (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className={cn(
              filled
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/30",
            )}
          />
        );
      })}
    </span>
  );
}
