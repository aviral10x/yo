"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  BedDouble,
  CalendarDays,
  Check,
  ClipboardList,
  Clock,
  FileText,
  Loader2,
  Plus,
  Printer,
  Sparkles,
  Trash2,
  Users,
  UtensilsCrossed,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  generateDaySheet,
  saveChecklist,
  saveDecorNotes,
  saveMenu,
  saveRooming,
  saveTimeline,
  saveVendors,
} from "@/app/dashboard/(panel)/events/actions";
import type {
  ChecklistItem,
  EventDetail,
  MenuCourse,
  RoomingRow,
  TimelineItem,
  VendorAssignment,
  VendorOption,
} from "./types";

const VENDOR_CATEGORY_LABELS: Record<string, string> = {
  photographer: "Photographer",
  caterer: "Caterer",
  decorator: "Décor",
  makeup: "Makeup",
  music: "Music / DJ",
  other: "Other",
};

function progress(checklist: ChecklistItem[]) {
  const total = checklist.length;
  const done = checklist.filter((c) => c.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}

function menuSelectedCount(courses: MenuCourse[]) {
  return courses.reduce((n, c) => n + c.items.filter((i) => i.selected).length, 0);
}

export function EventsBoard({
  events,
  vendorOptions,
}: {
  events: EventDetail[];
  vendorOptions: VendorOption[];
}) {
  const [open, setOpen] = useState<EventDetail | null>(null);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((ev) => {
          const { done, total, pct } = progress(ev.checklist);
          const ready = total > 0 && done === total;
          const dishes = menuSelectedCount(ev.menuCourses);
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

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" />
                    {ev.timeline.length} slots
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <UtensilsCrossed className="size-3" />
                    {dishes} dishes
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="size-3" />
                    {ev.vendors.length} vendors
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <EventSheet
        event={open}
        vendorOptions={vendorOptions}
        onOpenChange={(v) => {
          if (!v) setOpen(null);
        }}
      />
    </>
  );
}

function EventSheet({
  event,
  vendorOptions,
  onOpenChange,
}: {
  event: EventDetail | null;
  vendorOptions: VendorOption[];
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={!!event} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {event && (
          <EventSheetBody key={event.id} event={event} vendorOptions={vendorOptions} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function EventSheetBody({
  event,
  vendorOptions,
}: {
  event: EventDetail;
  vendorOptions: VendorOption[];
}) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(event.checklist);
  const [timeline, setTimeline] = useState<TimelineItem[]>(event.timeline);
  const [menuCourses, setMenuCourses] = useState<MenuCourse[]>(event.menuCourses);
  const [menuNotes, setMenuNotes] = useState(event.menuNotes);
  const [decorNotes, setDecorNotes] = useState(event.decorNotes);
  const [rooming, setRooming] = useState<RoomingRow[]>(event.rooming);
  const [vendors, setVendors] = useState<VendorAssignment[]>(event.vendors);
  const [daySheet, setDaySheet] = useState<string | null>(null);

  const [savingTimeline, startSaveTimeline] = useTransition();
  const [savingMenu, startSaveMenu] = useTransition();
  const [savingDecor, startSaveDecor] = useTransition();
  const [savingRooming, startSaveRooming] = useTransition();
  const [savingVendors, startSaveVendors] = useTransition();
  const [generating, startGenerate] = useTransition();

  const { done, total, pct } = progress(checklist);
  const ready = total > 0 && done === total;
  const demo = event.isDemo;

  // --- Checklist (auto-saves on toggle) ---
  function toggleChecklist(index: number, next: boolean) {
    const updated = checklist.map((c, i) => (i === index ? { ...c, done: next } : c));
    setChecklist(updated);
    if (!demo) {
      void saveChecklist(event.id, updated).then((r) => {
        if (!r.ok) toast.error(r.message);
      });
    }
  }

  // --- Timeline (add / remove / reorder) ---
  function updateTimelineRow(i: number, patch: Partial<TimelineItem>) {
    setTimeline((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addTimelineRow() {
    setTimeline((rows) => [...rows, { time: "", item: "" }]);
  }
  function removeTimelineRow(i: number) {
    setTimeline((rows) => rows.filter((_, idx) => idx !== i));
  }
  function moveTimelineRow(i: number, dir: -1 | 1) {
    setTimeline((rows) => {
      const j = i + dir;
      if (j < 0 || j >= rows.length) return rows;
      const next = [...rows];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function onSaveTimeline() {
    if (demo) return toast.error("Connect a database to save changes.");
    startSaveTimeline(async () => {
      const r = await saveTimeline(event.id, timeline);
      if (r.ok) toast.success(r.message);
      else toast.error(r.message);
    });
  }

  // --- Menu (checklist by course) ---
  function toggleDish(courseIdx: number, itemIdx: number, next: boolean) {
    setMenuCourses((courses) =>
      courses.map((c, ci) =>
        ci === courseIdx
          ? {
              ...c,
              items: c.items.map((it, ii) =>
                ii === itemIdx ? { ...it, selected: next } : it,
              ),
            }
          : c,
      ),
    );
  }
  function onSaveMenu() {
    if (demo) return toast.error("Connect a database to save changes.");
    startSaveMenu(async () => {
      const r = await saveMenu(event.id, menuCourses, menuNotes);
      if (r.ok) toast.success(r.message);
      else toast.error(r.message);
    });
  }

  function onSaveDecor() {
    if (demo) return toast.error("Connect a database to save changes.");
    startSaveDecor(async () => {
      const r = await saveDecorNotes(event.id, decorNotes);
      if (r.ok) toast.success(r.message);
      else toast.error(r.message);
    });
  }

  // --- Rooming list ---
  function updateRoomingRow(i: number, patch: Partial<RoomingRow>) {
    setRooming((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRoomingRow() {
    setRooming((rows) => [
      ...rows,
      { guest: "", roomType: "", nights: 1, checkIn: event.eventDate },
    ]);
  }
  function removeRoomingRow(i: number) {
    setRooming((rows) => rows.filter((_, idx) => idx !== i));
  }
  function onSaveRooming() {
    if (demo) return toast.error("Connect a database to save changes.");
    startSaveRooming(async () => {
      const r = await saveRooming(event.id, rooming);
      if (r.ok) toast.success(r.message);
      else toast.error(r.message);
    });
  }

  // --- Vendors ---
  const unassigned = useMemo(
    () => vendorOptions.filter((v) => !vendors.some((a) => a.vendorId === v.id)),
    [vendorOptions, vendors],
  );
  function assignVendor(id: string) {
    const opt = vendorOptions.find((v) => v.id === id);
    if (!opt) return;
    setVendors((prev) => [
      ...prev,
      {
        vendorId: opt.id,
        name: opt.name,
        category: opt.category,
        role: VENDOR_CATEGORY_LABELS[opt.category] ?? "Vendor",
      },
    ]);
  }
  function updateVendorRole(id: string, role: string) {
    setVendors((prev) =>
      prev.map((v) => (v.vendorId === id ? { ...v, role } : v)),
    );
  }
  function removeVendor(id: string) {
    setVendors((prev) => prev.filter((v) => v.vendorId !== id));
  }
  function onSaveVendors() {
    if (demo) return toast.error("Connect a database to save changes.");
    startSaveVendors(async () => {
      const r = await saveVendors(event.id, vendors);
      if (r.ok) toast.success(r.message);
      else toast.error(r.message);
    });
  }

  // --- Day sheet ---
  function onGenerate() {
    startGenerate(async () => {
      const r = await generateDaySheet({
        eventId: event.id,
        coupleName: event.coupleName,
        eventDate: formatDate(event.eventDate),
        spaceName: event.spaceName,
        guestCount: event.guestCount,
        checklist,
        timeline,
        menuCourses,
        vendors,
        rooming,
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
    const safe = daySheet.replace(
      /[&<>]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!,
    );
    w.document.write(
      `<title>Day sheet — ${event.coupleName}</title><pre style="font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;padding:32px;white-space:pre-wrap">${safe}</pre>`,
    );
    w.document.close();
    w.focus();
    w.print();
  }

  const dishCount = menuSelectedCount(menuCourses);

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
          {demo && (
            <span className="text-xs text-muted-foreground">· demo (read-only)</span>
          )}
        </div>
        <SheetTitle className="text-xl">{event.coupleName}</SheetTitle>
        <SheetDescription>
          {formatDate(event.eventDate)}
          {event.spaceName ? ` · ${event.spaceName}` : ""}
          {event.guestCount != null ? ` · ${event.guestCount} guests` : ""}
        </SheetDescription>
      </SheetHeader>

      <div className="px-4 pb-8">
        <Tabs defaultValue="timeline">
          <TabsList className="w-full">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="rooming">Rooming</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="daysheet">Day sheet</TabsTrigger>
          </TabsList>

          {/* ---- TIMELINE ---- */}
          <TabsContent value="timeline" className="mt-5 space-y-4">
            <SectionHead
              icon={Clock}
              title="Ceremony timeline"
              hint={`${timeline.length} slots`}
            />
            <div className="space-y-2">
              {timeline.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={row.time}
                    onChange={(e) => updateTimelineRow(i, { time: e.target.value })}
                    placeholder="7:30 PM"
                    className="h-9 w-28 shrink-0 tabular-nums"
                  />
                  <Input
                    value={row.item}
                    onChange={(e) => updateTimelineRow(i, { item: e.target.value })}
                    placeholder="What happens"
                    className="h-9"
                  />
                  <div className="flex shrink-0 items-center">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => moveTimelineRow(i, -1)}
                      disabled={i === 0}
                      aria-label="Move up"
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => moveTimelineRow(i, 1)}
                      disabled={i === timeline.length - 1}
                      aria-label="Move down"
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeTimelineRow(i)}
                      aria-label="Remove row"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {timeline.length === 0 && (
                <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
                  No timeline yet — add your first slot.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={addTimelineRow}>
                <Plus className="size-4" /> Add slot
              </Button>
              <SaveButton pending={savingTimeline} onClick={onSaveTimeline} demo={demo} />
            </div>
          </TabsContent>

          {/* ---- MENU ---- */}
          <TabsContent value="menu" className="mt-5 space-y-5">
            <SectionHead
              icon={UtensilsCrossed}
              title="Menu selections"
              hint={`${dishCount} selected`}
            />
            <div className="space-y-4">
              {menuCourses.map((course, ci) => {
                const picked = course.items.filter((i) => i.selected).length;
                return (
                  <div key={course.course}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-sm font-medium">{course.course}</p>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {picked}/{course.items.length}
                      </span>
                    </div>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {course.items.map((item, ii) => (
                        <label
                          key={item.label}
                          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                        >
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={(v) => toggleDish(ci, ii, v === true)}
                          />
                          <span className={cn(item.selected && "font-medium")}>
                            {item.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">Menu notes</label>
              <Textarea
                value={menuNotes}
                onChange={(e) => setMenuNotes(e.target.value)}
                placeholder="Veg/non-veg counts, Jain meals, allergies, special family dishes…"
                rows={3}
              />
            </div>
            <SaveButton pending={savingMenu} onClick={onSaveMenu} demo={demo} />
          </TabsContent>

          {/* ---- ROOMING ---- */}
          <TabsContent value="rooming" className="mt-5 space-y-4">
            <SectionHead
              icon={BedDouble}
              title="Rooming list"
              hint={`${rooming.reduce((n, r) => n + (r.nights || 0), 0)} room-nights`}
            />
            <div className="space-y-2">
              {rooming.map((row, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 rounded-lg border border-border/70 p-2.5 sm:flex-row sm:items-center"
                >
                  <Input
                    value={row.guest}
                    onChange={(e) => updateRoomingRow(i, { guest: e.target.value })}
                    placeholder="Guest / family"
                    className="h-9"
                  />
                  <Input
                    value={row.roomType}
                    onChange={(e) => updateRoomingRow(i, { roomType: e.target.value })}
                    placeholder="Room type"
                    className="h-9 sm:w-44"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={row.nights}
                    onChange={(e) =>
                      updateRoomingRow(i, { nights: Number(e.target.value) })
                    }
                    placeholder="Nights"
                    className="h-9 w-20 shrink-0 tabular-nums"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRoomingRow(i)}
                    aria-label="Remove guest"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
              {rooming.length === 0 && (
                <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
                  No rooms blocked yet — add a guest or family.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={addRoomingRow}>
                <Plus className="size-4" /> Add guest
              </Button>
              <SaveButton pending={savingRooming} onClick={onSaveRooming} demo={demo} />
            </div>
          </TabsContent>

          {/* ---- VENDORS ---- */}
          <TabsContent value="vendors" className="mt-5 space-y-4">
            <SectionHead
              icon={Users}
              title="Vendor assignment"
              hint={`${vendors.length} assigned`}
            />
            <div className="space-y-2">
              {vendors.map((v) => (
                <div
                  key={v.vendorId}
                  className="flex flex-col gap-2 rounded-lg border border-border/70 p-2.5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{v.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {VENDOR_CATEGORY_LABELS[v.category] ?? v.category}
                    </p>
                  </div>
                  <Input
                    value={v.role}
                    onChange={(e) => updateVendorRole(v.vendorId, e.target.value)}
                    placeholder="Role on the day"
                    className="h-9 sm:w-52"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeVendor(v.vendorId)}
                    aria-label="Remove vendor"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
              {vendors.length === 0 && (
                <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
                  No vendors assigned yet.
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value=""
                onValueChange={assignVendor}
                disabled={unassigned.length === 0}
              >
                <SelectTrigger size="sm" className="w-full sm:w-64">
                  <Plus className="size-3.5" />
                  <SelectValue
                    placeholder={
                      unassigned.length ? "Assign a vendor…" : "All vendors assigned"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {unassigned.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                      {v.preferred ? " · preferred" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <SaveButton pending={savingVendors} onClick={onSaveVendors} demo={demo} />
            </div>
          </TabsContent>

          {/* ---- CHECKLIST + DÉCOR ---- */}
          <TabsContent value="checklist" className="mt-5 space-y-6">
            <div>
              <SectionHead
                icon={ClipboardList}
                title="Setup checklist"
                hint={`${done}/${total} done`}
              />
              <div className="mt-3 mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
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
                      onCheckedChange={(v) => toggleChecklist(i, v === true)}
                    />
                    <span className={cn(item.done && "text-muted-foreground line-through")}>
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
              {demo && (
                <p className="mt-2 px-2 text-xs text-muted-foreground">
                  Connect a database to save checklist changes.
                </p>
              )}
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
              <div className="mt-2">
                <SaveButton pending={savingDecor} onClick={onSaveDecor} demo={demo} />
              </div>
            </div>
          </TabsContent>

          {/* ---- DAY SHEET ---- */}
          <TabsContent value="daysheet" className="mt-5 space-y-3">
            <SectionHead icon={FileText} title="Day sheet" />
            <p className="text-sm text-muted-foreground">
              Generate a clean, print-ready brief for the on-ground team — timeline,
              checklist, menu, vendors, rooming, and décor on one page.
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
              <pre className="mt-2 max-h-[28rem] overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {daySheet}
              </pre>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function SectionHead({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof Clock;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-primary" />
        {title}
      </h3>
      {hint && (
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {hint}
        </span>
      )}
    </div>
  );
}

function SaveButton({
  pending,
  onClick,
  demo,
}: {
  pending: boolean;
  onClick: () => void;
  demo: boolean;
}) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={pending || demo}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Saving…
        </>
      ) : (
        <>
          <Check className="size-4" /> Save
        </>
      )}
    </Button>
  );
}
