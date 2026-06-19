"use client";

import { useMemo, useState } from "react";
import { Plus, Sparkles, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProposalActions } from "./proposal-actions";
import type { LeadOption, LineItem, PackageOption, ProposalRow } from "./types";

const DEPOSIT_OPTIONS = [10, 20, 25, 30];
let idSeq = 0;
const nextId = () => `li_${++idSeq}`;

export function NewQuoteDialog({
  leads,
  packages,
}: {
  leads: LeadOption[];
  packages: PackageOption[];
}) {
  const [open, setOpen] = useState(false);
  const [leadId, setLeadId] = useState<string>(leads[0]?.id ?? "");
  const [packageId, setPackageId] = useState<string>("");
  const [depositPct, setDepositPct] = useState<number>(20);
  const [items, setItems] = useState<LineItem[]>([
    { id: nextId(), label: "Venue rental", qty: 1, unitPrice: 350000 },
  ]);
  const [saved, setSaved] = useState<ProposalRow | null>(null);

  const lead = leads.find((l) => l.id === leadId);
  const pkg = packages.find((p) => p.id === packageId);

  const total = useMemo(
    () => items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0),
    [items],
  );
  const deposit = Math.round((total * depositPct) / 100);

  function applyPackage(id: string) {
    setPackageId(id);
    const p = packages.find((x) => x.id === id);
    if (!p) return;
    const guests = lead?.guestCount ?? 300;
    setItems((prev) => {
      const withoutCatering = prev.filter((it) => !it.label.startsWith("Catering"));
      return [
        ...withoutCatering,
        {
          id: nextId(),
          label: `Catering — ${p.name} (per plate)`,
          qty: guests,
          unitPrice: p.perPlate,
        },
      ];
    });
  }

  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: nextId(), label: "", qty: 1, unitPrice: 0 },
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function reset() {
    setSaved(null);
    setPackageId("");
    setDepositPct(20);
    setItems([{ id: nextId(), label: "Venue rental", qty: 1, unitPrice: 350000 }]);
  }

  function save() {
    if (!lead) return;
    setSaved({
      id: `qt_${Date.now()}`,
      coupleName: lead.coupleName,
      contact: lead.phone,
      leadId: lead.id,
      eventDate: lead.dateRequested,
      packageName: pkg?.name ?? "Custom",
      guestCount: lead.guestCount,
      total,
      depositPct,
      status: "draft",
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New quote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-5 text-left">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            {saved ? "Quote ready" : "New quote"}
          </DialogTitle>
          <DialogDescription>
            {saved
              ? "Place a provisional hold, then send a deposit link to lock it in."
              : "Pick a couple and package, then fine-tune the line items."}
          </DialogDescription>
        </DialogHeader>

        {saved ? (
          <SavedView row={saved} onReset={reset} />
        ) : (
          <div className="max-h-[60vh] space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Couple / lead</Label>
                <Select value={leadId} onValueChange={setLeadId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.coupleName} · {l.guestCount} pax
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Package</Label>
                <Select value={packageId} onValueChange={applyPackage}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} · {formatINR(p.perPlate)}/plate
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {lead && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3.5" /> {lead.guestCount} guests
                </span>
                <span>
                  {EVENT_TYPE_LABELS[lead.eventType] ?? lead.eventType}
                </span>
                <span>{lead.phone}</span>
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-sm">Line items</Label>
                <Button variant="ghost" size="xs" onClick={addItem}>
                  <Plus className="size-3" /> Add row
                </Button>
              </div>
              <div className="space-y-2">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center gap-2">
                    <Input
                      value={it.label}
                      placeholder="Description"
                      onChange={(e) => updateItem(it.id, { label: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={it.qty}
                      onChange={(e) =>
                        updateItem(it.id, { qty: Number(e.target.value) || 0 })
                      }
                      className="w-16 text-center tabular-nums"
                      aria-label="Quantity"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={it.unitPrice}
                      onChange={(e) =>
                        updateItem(it.id, { unitPrice: Number(e.target.value) || 0 })
                      }
                      className="w-28 text-right tabular-nums"
                      aria-label="Unit price"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(it.id)}
                      aria-label="Remove line item"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatINR(total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quote total</span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatINR(total)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-sm text-muted-foreground">Booking deposit</span>
                <div className="flex items-center gap-1.5">
                  {DEPOSIT_OPTIONS.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDepositPct(pct)}
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-xs tabular-nums transition-colors",
                        depositPct === pct
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/70 text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                <span className="text-sm font-medium text-primary">
                  Deposit to collect
                </span>
                <span className="text-base font-semibold tabular-nums text-primary">
                  {formatINR(deposit)}
                </span>
              </div>
            </div>
          </div>
        )}

        {!saved && (
          <DialogFooter className="border-t px-6 py-4" showCloseButton>
            <Button onClick={save} disabled={!lead || total <= 0}>
              Create quote
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SavedView({ row, onReset }: { row: ProposalRow; onReset: () => void }) {
  const deposit = Math.round((row.total * row.depositPct) / 100);
  return (
    <div className="space-y-5 px-6 py-5">
      <div className="rounded-xl border border-border/70 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium">{row.coupleName}</p>
            <p className="text-sm text-muted-foreground">
              {row.packageName} · {row.guestCount} guests
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold tabular-nums">
              {formatINR(row.total)}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatINR(deposit)} deposit ({row.depositPct}%)
            </p>
          </div>
        </div>
        <Separator className="my-4" />
        <ProposalActions row={row} />
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={onReset}>
          Build another
        </Button>
      </div>
    </div>
  );
}
