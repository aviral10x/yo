"use client";

import { useTransition } from "react";
import {
  Check,
  ImageIcon,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { requestUpload } from "@/app/dashboard/(panel)/media/actions";

export type MediaSlot = {
  category: string;
  label: string;
  filled: boolean;
  aiTags: string[];
};

export function MediaPack({ slots }: { slots: MediaSlot[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {slots.map((slot) => (
        <SlotCard key={slot.category} slot={slot} />
      ))}
    </div>
  );
}

function SlotCard({ slot }: { slot: MediaSlot }) {
  const [pending, start] = useTransition();

  function onUpload() {
    start(async () => {
      const r = await requestUpload(slot.category);
      if (r.ok) toast.success(r.message);
      else toast.error(r.message);
    });
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/70 transition-colors",
        !slot.filled && "border-dashed",
      )}
    >
      <CardContent className="space-y-3">
        {/* Thumbnail surface */}
        <div
          className={cn(
            "relative flex aspect-[4/3] items-center justify-center rounded-lg",
            slot.filled
              ? "bg-gradient-to-br from-primary/15 via-primary/5 to-amber-500/10"
              : "bg-muted/50",
          )}
        >
          {slot.filled ? (
            <>
              <ImageIcon className="size-8 text-primary/50" />
              <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                <Check className="size-3" /> Filled
              </span>
            </>
          ) : (
            <button
              type="button"
              onClick={onUpload}
              disabled={pending}
              className="group flex flex-col items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              {pending ? (
                <Loader2 className="size-7 animate-spin" />
              ) : (
                <Upload className="size-7 transition-transform group-hover:-translate-y-0.5" />
              )}
              <span className="text-xs font-medium">Upload</span>
            </button>
          )}
        </div>

        <div>
          <p className="text-sm font-medium">{slot.label}</p>
          {slot.filled ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {slot.aiTags.length ? (
                slot.aiTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 font-normal"
                  >
                    <Sparkles className="size-2.5 text-primary" />
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  Tagging…
                </span>
              )}
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Missing — add a photo to complete the pack.
            </p>
          )}
        </div>

        {slot.filled && (
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
            onClick={onUpload}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Upload className="size-3" />
            )}
            Replace
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
