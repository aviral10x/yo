"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Languages,
  MessageSquare,
  Phone,
  Search,
  Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Composer } from "./composer";
import type { Thread, ThreadMessage } from "./types";

function lastMessageOf(t: Thread): ThreadMessage | undefined {
  return t.messages[t.messages.length - 1];
}

function previewOf(t: Thread): string {
  const last = lastMessageOf(t);
  if (!last) return "No messages yet";
  return last.direction === "out" ? `You: ${last.body}` : last.body;
}

export function Inbox({
  threads: initialThreads,
  venue,
}: {
  threads: Thread[];
  venue?: string;
}) {
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [activeId, setActiveId] = useState<string | undefined>(
    initialThreads[0]?.id,
  );
  const [query, setQuery] = useState("");
  // Mobile: toggle between list and thread.
  const [mobileThread, setMobileThread] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.couple.toLowerCase().includes(q) ||
        previewOf(t).toLowerCase().includes(q),
    );
  }, [threads, query]);

  const active = threads.find((t) => t.id === activeId);
  const lastInbound = active
    ? [...active.messages].reverse().find((m) => m.direction === "in")
    : undefined;

  function selectThread(id: string) {
    setActiveId(id);
    setMobileThread(true);
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t)),
    );
  }

  function handleSent(body: string) {
    if (!active) return;
    const newMsg: ThreadMessage = {
      id: `local_${Date.now()}`,
      direction: "out",
      body,
      at: "now",
    };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? {
              ...t,
              messages: [
                // Strip the AI draft from the answered inbound message.
                ...t.messages.map((m) =>
                  m.id === lastInbound?.id ? { ...m, aiDraft: undefined } : m,
                ),
                newMsg,
              ],
            }
          : t,
      ),
    );
  }

  return (
    <div className="grid h-[calc(100vh-12rem)] min-h-[34rem] grid-cols-1 overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm md:grid-cols-[clamp(18rem,30%,22rem)_1fr]">
      {/* Conversation list */}
      <div
        className={cn(
          "flex min-h-0 flex-col border-r bg-muted/20",
          mobileThread && "hidden md:flex",
        )}
      >
        <div className="space-y-3 border-b bg-background/60 p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Inbox</h2>
            <Badge
              variant="secondary"
              className="gap-1 bg-primary/10 text-primary"
            >
              <Languages className="size-3" />
              EN / HI
            </Badge>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations…"
              className="h-9 bg-background pl-8"
            />
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <ul className="divide-y divide-border/60">
            {filtered.map((t) => {
              const last = lastMessageOf(t);
              const isActive = t.id === activeId;
              const hasDraft = t.messages.some((m) => m.aiDraft);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => selectThread(t.id)}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/60",
                      isActive && "bg-accent",
                    )}
                  >
                    <Avatar className="mt-0.5">
                      <AvatarFallback className="bg-primary/12 font-medium text-primary">
                        {t.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {t.couple}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                          {last?.at ?? ""}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "mt-0.5 line-clamp-1 text-xs text-muted-foreground",
                          t.unread > 0 && "font-medium text-foreground",
                        )}
                      >
                        {previewOf(t)}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        {hasDraft && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            <Sparkles className="size-2.5" />
                            AI reply ready
                          </span>
                        )}
                        {t.unread > 0 && (
                          <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground tabular-nums">
                            {t.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-10 text-center text-sm text-muted-foreground">
                No conversations match “{query}”.
              </li>
            )}
          </ul>
        </ScrollArea>
      </div>

      {/* Thread + composer */}
      <div
        className={cn(
          "flex min-h-0 flex-col",
          !mobileThread && "hidden md:flex",
        )}
      >
        {active ? (
          <>
            <div className="flex items-center gap-3 border-b bg-background/70 px-4 py-3 backdrop-blur">
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                onClick={() => setMobileThread(false)}
                aria-label="Back to inbox"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Avatar size="lg">
                <AvatarFallback className="bg-primary/12 font-medium text-primary">
                  {active.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{active.couple}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 capitalize">
                    <MessageSquare className="size-3" />
                    {active.channel}
                  </span>
                  {active.phone && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Phone className="size-3" />
                        {active.phone}
                      </span>
                    </>
                  )}
                </p>
              </div>
              {active.context && (
                <Badge
                  variant="outline"
                  className="hidden border-border/70 text-muted-foreground sm:inline-flex"
                >
                  {active.context}
                </Badge>
              )}
            </div>

            <ScrollArea className="min-h-0 flex-1 bg-[radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:22px_22px]">
              <div className="flex flex-col gap-3 px-4 py-5">
                {active.messages.map((m) => (
                  <Bubble key={m.id} m={m} />
                ))}
                {lastInbound?.aiDraft && (
                  <div className="ml-auto flex max-w-[82%] items-center gap-1.5 self-end pr-1 text-[11px] text-primary">
                    <Sparkles className="size-3" />
                    AI drafted a reply below — review &amp; send.
                  </div>
                )}
              </div>
            </ScrollArea>

            <Composer
              key={active.id}
              thread={active}
              lastInbound={lastInbound}
              venue={venue}
              onSent={handleSent}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <MessageSquare className="size-6" />
            </span>
            <div>
              <p className="font-medium">Select a conversation</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Pick an enquiry to read the thread and send an AI-drafted reply.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Bubble({ m }: { m: ThreadMessage }) {
  const isOut = m.direction === "out";
  return (
    <div
      className={cn(
        "flex max-w-[82%] flex-col gap-1",
        isOut ? "ml-auto items-end" : "mr-auto items-start",
      )}
    >
      <div
        className={cn(
          "rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
          isOut
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border border-border/60 bg-background",
        )}
      >
        <p className="whitespace-pre-wrap text-pretty">{m.body}</p>
      </div>
      <span
        className={cn(
          "flex items-center gap-1 px-1 text-[10px] text-muted-foreground tabular-nums",
          isOut ? "flex-row-reverse" : "",
        )}
      >
        {m.at}
        {isOut &&
          (m.id.startsWith("local_") ? (
            <Check className="size-3" />
          ) : (
            <CheckCheck className="size-3 text-primary" />
          ))}
      </span>
    </div>
  );
}
