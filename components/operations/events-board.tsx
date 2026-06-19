"use client";

import { useState, useTransition } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Loader2,
  Printer,
  Sparkles,
  UtensilsCrossed,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  generateDaySheet,
  saveChecklist,
  saveNotes,
} from "@/app/dashboard/(panel)/events/actions";
import type { ChecklistItem, EventDetail } from "./types";

function progress(checklist: ChecklistItem[]) {
  const total = checklist.length;
  const done = checklist.filter((c) => c.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}

export function EventsBoard({ events }: { events: EventDetail[] }) {
  const [open, setOpen] = useState<EventDetail | null>(null);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((ev) => {
          const { done, total, pct } = progress(ev.checklist);
          const ready = total > 0 && done === total;
          return (
            <Card
              key={ev.id}
              className="cursor-pointer border-border/70 transition-shadow hover:shadow-md"
              onClick={() => setOpen(ev)}
            >
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{ev.coupleName}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      {formatDate(ev.eventDate)}
                    </p>
                  </div>
                  <Badge variant={ready ? "default" : "secondary"}>
                    {ready ? "Ready" : `${pct}%`}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="capitalize">
                    {EVENT_TYPE_LABELS[ev.eventType] ?? ev.eventType}
                  </span>
                  {ev.spaceName && <span>{ev.spaceName}</span>}
                  {ev.guestCount != null && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3" />
                      {ev.guestCount}
                    </span>
                  )}
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Run-of-show checklist</span>
                    <span className="font-medium tabular-nums">
                      {done}/{total}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        ready ? "bg-emerald-600" : "bg-primary",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <EventSheet
        event={open}
        onOpenChange={(v) => {
          if (!v) setOpen(null);
        }}
      />
    </>
  );
}

function EventSheet({
  event,
  onOpenChange,
}: {
  event: EventDetail | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={!!event} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {event && <EventSheetBody key={event.id} event={event} />}
      </SheetContent>
    </Sheet>
  );
}

function EventSheetBody({ event }: { event: EventDetail }) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(event.checklist);
  const [menuNotes, setMenuNotes] = useState(event.menuNotes);
  const [decorNotes, setDecorNotes] = useState(event.decorNotes);
  const [daySheet, setDaySheet] = useState<string | null>(null);
  const [savingNotes, startSaveNotes] = useTransition();
  const [generating, startGenerate] = useTransition();

  const { done, total, pct } = progress(checklist);
  const ready = total > 0 && done === total;

  function toggle(index: number, next: boolean) {
    const updated = checklist.map((c, i) =>
      i === index ? { ...c, done: next } : c,
    );
    setChecklist(updated);
    void saveChecklist(event.id, updated).then((r) => {
      if (!r.ok) toast.error(r.message);
    });
  }

  function onSaveNotes() {
    startSaveNotes(async () => {
      const r = await saveNotes(event.id, menuNotes, decorNotes);
      if (r.ok) toast.success(r.message);
      else toast.error(r.message);
    });
  }

  function onGenerate() {
    startGenerate(async () => {
      const r = await generateDaySheet({
        eventId: event.id,
        coupleName: event.coupleName,
        eventDate: formatDate(event.eventDate),
        spaceName: event.spaceName,
        guestCount: event.guestCount,
        checklist,
        timeline: event.timeline,
        menuNotes,
        decorNotes,
      });
      if (r.ok && r.daySheet) {
        setDaySheet(r.daySheet);
        toast.success(r.message);
      } else {
        toast.error(r.message);
      }
    });
  }

  function printSheet() {
    if (!daySheet) return;
    const w = window.open("", "_blank", "width=720,height=900");
    if (!w) return;
    w.document.write(
      `<pre style="font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;padding:32px;white-space:pre-wrap">${daySheet.replace(
        /[&<>]/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!,
      )}</pre>`,
    );
    w.document.title = `Day sheet — ${event.coupleName}`;
    w.document.close();
    w.print();
  }

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2">
          <Badge variant={ready ? "default" : "secondary"}>
            {ready ? "Ready to run" : `${pct}% prepped`}
          </Badge>
          <span className="text-xs text-muted-foreground capitalize">
            {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
          </span>
        </div>
        <SheetTitle className="text-xl">{event.coupleName}</SheetTitle>
        <SheetDescription>
          {formatDate(event.eventDate)}
          {event.spaceName ? ` · ${event.spaceName}` : ""}
          {event.guestCount != null ? ` · ${event.guestCount} guests` : ""}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-6 px-4 pb-8">
        {/* Checklist */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ClipboardList className="size-4 text-primary" />
              Setup checklist
            </h3>
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {done}/{total} done
            </span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                ready ? "bg-emerald-600" : "bg-primary",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="space-y-1">
            {checklist.map((item, i) => (
              <label
                key={`${item.label}-${i}`}
                className="flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
              >
                <Checkbox
                  checked={item.done}
                  onCheckedChange={(v) => toggle(i, v === true)}
                />
                <span
                  className={cn(
                    item.done && "text-muted-foreground line-through",
                  )}
                >
                  {item.label}
                </span>
              </label>
            ))}
            {checklist.length === 0 && (
              <p className="px-2 text-sm text-muted-foreground">
                No checklist items yet.
              </p>
            )}
          </div>
        </section>

        <Separator />

        {/* Timeline */}
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Clock className="size-4 text-primary" />
            Ceremony timeline
          </h3>
          {event.timeline.length ? (
            <ol className="relative space-y-4 border-l border-border/70 pl-5">
              {event.timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[1.42rem] top-1 size-2.5 rounded-full border-2 border-background bg-primary" />
                  <p className="text-sm font-medium tabular-nums">{t.time}</p>
                  <p className="text-sm text-muted-foreground">{t.item}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">No timeline yet.</p>
          )}
        </section>

        <Separator />

        {/* Menu + décor notes */}
        <section className="space-y-4">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <UtensilsCrossed className="size-4 text-primary" />
              Menu notes
            </label>
            <Textarea
              value={menuNotes}
              onChange={(e) => setMenuNotes(e.target.value)}
              placeholder="Veg/non-veg counts, live counters, special requests, Jain meals…"
              rows={3}
            />
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-primary" />
              Décor notes
            </label>
            <Textarea
              value={decorNotes}
              onChange={(e) => setDecorNotes(e.target.value)}
              placeholder="Stage theme, floral palette, lighting, rain-backup plan…"
              rows={3}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onSaveNotes}
            disabled={savingNotes}
          >
            {savingNotes ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" /> Save notes
              </>
            )}
          </Button>
        </section>

        <Separator />

        {/* Day sheet */}
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <FileText className="size-4 text-primary" />
            Day sheet
          </h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Generate a print-ready brief for the on-ground team — timeline,
            checklist, menu, and décor on one page.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Generate day sheet
                </>
              )}
            </Button>
            {daySheet && (
              <Button variant="outline" onClick={printSheet}>
                <Printer className="size-4" /> Print
              </Button>
            )}
          </div>
          {daySheet && (
            <pre className="mt-4 max-h-72 overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {daySheet}
            </pre>
          )}
        </section>
      </div>
    </>
  );
}
