"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Loader2,
  MessageSquareReply,
  Pencil,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { SourceBadge } from "@/components/reviews/source-badge";
import { Stars } from "@/components/reviews/stars";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import { draftReply, saveResponse } from "@/app/dashboard/(panel)/reviews/actions";

export type ReviewCardData = {
  id: string;
  author: string | null;
  rating: number | null;
  text: string | null;
  source: string;
  response?: string | null;
  respondedAt?: string | Date | null;
};

function initials(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function ReviewCard({ review }: { review: ReviewCardData }) {
  const [response, setResponse] = useState(review.response ?? "");
  const [draftOpen, setDraftOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [saving, startSaving] = useTransition();

  const hasSavedResponse = Boolean(review.response);

  async function handleDraft() {
    setDrafting(true);
    try {
      const result = await draftReply({
        author: review.author,
        rating: review.rating,
        text: review.text,
        source: review.source,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setResponse(result.draft);
      setAiGenerated(result.generatedByAI);
      setDraftOpen(true);
      setEditing(false);
      toast.success(
        result.generatedByAI ? "AI reply drafted" : "Reply drafted from a template",
      );
    } finally {
      setDrafting(false);
    }
  }

  function handleSave() {
    startSaving(async () => {
      const result = await saveResponse({ reviewId: review.id, response });
      if (result.ok) {
        toast.success(result.message);
        setDraftOpen(false);
        setEditing(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  const composerOpen = draftOpen || editing;

  return (
    <Card className="border-border/70">
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials(review.author)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium leading-none">
                  {review.author ?? "Anonymous guest"}
                </p>
                <SourceBadge source={review.source} />
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <Stars rating={review.rating} />
                <span className="text-xs tabular-nums text-muted-foreground">
                  {review.rating ?? 0}.0
                </span>
              </div>
            </div>
          </div>
          {!hasSavedResponse && !composerOpen && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDraft}
              disabled={drafting}
            >
              {drafting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Drafting…
                </>
              ) : (
                <>
                  <Sparkles className="size-4 text-primary" /> Draft AI reply
                </>
              )}
            </Button>
          )}
        </div>

        {review.text && (
          <p className="text-pretty text-sm text-muted-foreground">
            {review.text}
          </p>
        )}

        {hasSavedResponse && !editing && (
          <div className="rounded-lg border border-border/70 bg-muted/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <MessageSquareReply className="size-3.5" />
                Your response
                {review.respondedAt && (
                  <span className="font-normal text-muted-foreground">
                    · {formatDate(review.respondedAt)}
                  </span>
                )}
              </p>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setResponse(review.response ?? "");
                  setEditing(true);
                  setAiGenerated(false);
                }}
              >
                <Pencil className="size-3" /> Edit
              </Button>
            </div>
            <p className="mt-1.5 text-pretty text-sm">{review.response}</p>
          </div>
        )}

        {composerOpen && (
          <div className="space-y-2.5 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                {aiGenerated ? (
                  <>
                    <Sparkles className="size-3.5" /> AI draft — review &amp; edit
                  </>
                ) : (
                  <>
                    <MessageSquareReply className="size-3.5" /> Compose response
                  </>
                )}
              </p>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="Cancel"
                onClick={() => {
                  setDraftOpen(false);
                  setEditing(false);
                  setResponse(review.response ?? "");
                }}
              >
                <X className="size-3" />
              </Button>
            </div>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Write a warm, professional reply…"
              className="min-h-24 bg-background"
            />
            <div className="flex items-center justify-between gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDraft}
                disabled={drafting}
                className="text-muted-foreground"
              >
                {drafting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                {drafting ? "Drafting…" : "Redraft"}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !response.trim()}
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" /> Save response
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
