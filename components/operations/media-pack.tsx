"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Check,
  ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  Upload,
  Wand2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  autoTagCategory,
  requestUpload,
  saveTags,
} from "@/app/dashboard/(panel)/media/actions";

export type MediaSlot = {
  category: string;
  label: string;
  filled: boolean;
  aiTags: string[];
};

export function MediaPack({
  slots,
  liveDb,
}: {
  slots: MediaSlot[];
  liveDb: boolean;
}) {
  // Tags are editable client-side per slot; we keep the live state here so the
  // filter bar and the chips stay in sync.
  const [tagsByCategory, setTagsByCategory] = useState<Record<string, string[]>>(
    () => Object.fromEntries(slots.map((s) => [s.category, s.aiTags])),
  );
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const list of Object.values(tagsByCategory)) {
      for (const t of list) set.add(t);
    }
    return [...set].sort();
  }, [tagsByCategory]);

  function setSlotTags(category: string, tags: string[]) {
    setTagsByCategory((prev) => ({ ...prev, [category]: tags }));
  }

  const visible = useMemo(() => {
    if (!activeTag) return slots;
    return slots.filter((s) => (tagsByCategory[s.category] ?? []).includes(activeTag));
  }, [slots, activeTag, tagsByCategory]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">The photo pack</h2>
        <span className="text-xs text-muted-foreground">
          12 standard shots every venue needs
        </span>
      </div>

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted-foreground">Filter by tag</span>
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              activeTag === null
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag((t) => (t === tag ? null : tag))}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                activeTag === tag
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((slot) => (
          <SlotCard
            key={slot.category}
            slot={slot}
            liveDb={liveDb}
            tags={tagsByCategory[slot.category] ?? []}
            onTagsChange={(tags) => setSlotTags(slot.category, tags)}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          No photos tagged{" "}
          <span className="font-medium text-foreground">{activeTag}</span>.{" "}
          <button
            type="button"
            className="text-primary underline-offset-2 hover:underline"
            onClick={() => setActiveTag(null)}
          >
            Clear filter
          </button>
        </p>
      )}
    </div>
  );
}

function SlotCard({
  slot,
  liveDb,
  tags,
  onTagsChange,
}: {
  slot: MediaSlot;
  liveDb: boolean;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}) {
  const [pending, startUpload] = useTransition();
  const [tagging, startTagging] = useTransition();
  const [saving, startSaving] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  function onUpload() {
    startUpload(async () => {
      const r = await requestUpload(slot.category);
      if (r.ok) toast.success(r.message);
      else toast.error(r.message);
    });
  }

  function onAutoTag() {
    startTagging(async () => {
      const r = await autoTagCategory(slot.category);
      if (r.ok && r.tags) {
        // Merge AI suggestions into the existing set (no duplicates).
        const merged = [...tags];
        for (const t of r.tags) if (!merged.includes(t)) merged.push(t);
        onTagsChange(merged.slice(0, 8));
        setEditing(true);
        toast.success(r.message);
      } else {
        toast.error(r.message);
      }
    });
  }

  function addTag() {
    const t = draft.trim().toLowerCase();
    if (!t) return;
    if (!tags.includes(t)) onTagsChange([...tags, t].slice(0, 8));
    setDraft("");
  }

  function removeTag(tag: string) {
    onTagsChange(tags.filter((t) => t !== tag));
  }

  function onSaveTags() {
    if (!liveDb) {
      toast.error("Connect a database to save tags.");
      return;
    }
    startSaving(async () => {
      const r = await saveTags(slot.category, tags);
      if (r.ok) {
        setEditing(false);
        toast.success(r.message);
      } else {
        toast.error(r.message);
      }
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
            <>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {tags.length ? (
                  tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 font-normal">
                      <Sparkles className="size-2.5 text-primary" />
                      {tag}
                      {editing && (
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-0.5 text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${tag}`}
                        >
                          <X className="size-2.5" />
                        </button>
                      )}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No tags yet.</span>
                )}
              </div>

              {editing && (
                <div className="mt-2 flex items-center gap-1.5">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add a tag…"
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={addTag}
                    aria-label="Add tag"
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Missing — add a photo to complete the pack.
            </p>
          )}
        </div>

        {slot.filled && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={onAutoTag}
              disabled={tagging}
            >
              {tagging ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Wand2 className="size-3" />
              )}
              Auto-tag with AI
            </Button>

            {editing ? (
              <Button
                variant="default"
                size="xs"
                onClick={onSaveTags}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Check className="size-3" />
                )}
                Save tags
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="xs"
                className="text-muted-foreground"
                onClick={() => setEditing(true)}
              >
                Edit tags
              </Button>
            )}

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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
