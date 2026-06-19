"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, RefreshCw, Send, Sparkles, WandSparkles } from "lucide-react";
import { toast } from "sonner";

import { draftReply, sendReply } from "@/app/dashboard/(panel)/messages/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Thread, ThreadMessage } from "./types";

export function Composer({
  thread,
  lastInbound,
  venue,
  onSent,
}: {
  thread: Thread;
  lastInbound?: ThreadMessage;
  venue?: string;
  onSent: (body: string) => void;
}) {
  const [value, setValue] = useState(lastInbound?.aiDraft ?? "");
  const [source, setSource] = useState<"ai" | "template" | "manual">(
    lastInbound?.aiDraft ? "ai" : "manual",
  );
  const [drafting, startDrafting] = useTransition();
  const [sending, startSending] = useTransition();
  const taRef = useRef<HTMLTextAreaElement>(null);
  // State resets per conversation via a `key` on this component in <Inbox>, so
  // no effect is needed to sync the draft when the active thread changes.

  function redraft() {
    if (!lastInbound) return;
    startDrafting(async () => {
      const res = await draftReply({
        couple: thread.couple,
        body: lastInbound.body,
        venue,
        fallback: lastInbound.aiDraft,
        context: thread.context,
      });
      if (res.ok && res.text) {
        setValue(res.text);
        setSource(res.source ?? "ai");
        toast.success(
          res.source === "ai" ? "Fresh AI draft ready" : "Suggested a reply",
        );
        requestAnimationFrame(() => taRef.current?.focus());
      } else {
        toast.error(res.message ?? "Couldn't draft a reply.");
      }
    });
  }

  function send() {
    const body = value.trim();
    if (!body) {
      toast.error("Write a reply first.");
      taRef.current?.focus();
      return;
    }
    startSending(async () => {
      const res = await sendReply({
        conversationId: thread.conversationId,
        body,
      });
      if (res.ok) {
        onSent(body);
        setValue("");
        setSource("manual");
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="border-t bg-background/80 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {lastInbound && (
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            {source === "manual"
              ? "AI suggestion"
              : source === "ai"
                ? "AI-drafted reply"
                : "Suggested reply"}
            <span className="font-normal text-muted-foreground">
              · review &amp; edit before sending
            </span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={redraft}
            disabled={drafting || sending}
            className="text-muted-foreground hover:text-foreground"
          >
            {drafting ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <RefreshCw className="size-3" />
            )}
            Redraft
          </Button>
        </div>
      )}

      <div
        className={cn(
          "rounded-xl border border-border/70 bg-card shadow-sm transition-shadow focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40",
          source === "ai" &&
            "border-primary/40 ring-1 ring-primary/15",
        )}
      >
        <Textarea
          ref={taRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (source !== "manual") setSource("manual");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Write a reply, or tap Redraft for an AI suggestion…"
          className="min-h-20 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-medium">
              ⌘
            </kbd>
            <kbd className="ml-0.5 rounded border bg-muted px-1 py-0.5 text-[10px] font-medium">
              ↵
            </kbd>{" "}
            to send
          </span>
          <div className="ml-auto flex items-center gap-2">
            {lastInbound && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={redraft}
                disabled={drafting || sending}
                className="gap-1.5"
              >
                {drafting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <WandSparkles className="size-3.5" />
                )}
                <span className="hidden sm:inline">AI draft</span>
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={send}
              disabled={sending || drafting || !value.trim()}
              className="gap-1.5"
            >
              {sending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
