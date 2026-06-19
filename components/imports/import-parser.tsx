"use client";

import { useState, useTransition } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardPaste,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  UserPlus,
  Users,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import {
  createImportedLead,
  parseEnquiry,
} from "@/app/dashboard/(panel)/imports/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EVENT_TYPE_LABELS, LEAD_SOURCE_LABELS } from "@/lib/constants";
import type { ParsedEnquiry } from "@/components/imports/import-types";

export function ImportParser({
  sample,
  aiLive,
}: {
  sample: string;
  aiLive: boolean;
}) {
  const [raw, setRaw] = useState(sample);
  const [parsed, setParsed] = useState<ParsedEnquiry | null>(null);
  const [source, setSource] = useState<"ai" | "template" | null>(null);
  const [parsing, startParse] = useTransition();
  const [importing, startImport] = useTransition();

  function set<K extends keyof ParsedEnquiry>(key: K, value: ParsedEnquiry[K]) {
    setParsed((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function runParse() {
    const text = raw.trim();
    if (text.length < 8) {
      toast.error("Paste an enquiry to parse.");
      return;
    }
    startParse(async () => {
      const res = await parseEnquiry(text);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      setParsed(res.parsed);
      setSource(res.source);
      toast.success(
        res.source === "ai"
          ? "Parsed by AI — review and import"
          : "Parsed — review and import",
      );
    });
  }

  function runImport() {
    if (!parsed) return;
    startImport(async () => {
      const res = await createImportedLead(parsed);
      if (res.ok) {
        toast.success(res.message);
        setParsed(null);
        setSource(null);
        return;
      }
      toast.error(res.message);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      {/* ---- Paste ---- */}
      <Card className="border-border/70">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardPaste className="size-4 text-primary" />
            Paste a raw enquiry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={12}
            spellCheck={false}
            placeholder="Paste a WedMeGood / Weddingz / VenueLook enquiry, a forwarded email, or a WhatsApp message…"
            className="min-h-[260px] resize-y font-mono text-xs leading-relaxed"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {aiLive
                ? "Claude reads it and fills the fields for you."
                : "Demo mode · add ANTHROPIC_API_KEY for AI extraction."}
            </p>
            <Button type="button" onClick={runParse} disabled={parsing}>
              {parsing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Wand2 className="size-4" />
              )}
              Parse with AI
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ---- Preview ---- */}
      {!parsed ? (
        <PreviewEmpty pending={parsing} />
      ) : (
        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4 text-primary" />
              Review &amp; import
            </CardTitle>
            <Badge
              variant={source === "ai" ? "default" : "outline"}
              className="gap-1.5"
            >
              <Sparkles className="size-3" />
              {source === "ai" ? "AI parsed" : "Smart parse"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ip-name" className="flex items-center gap-1.5">
                <UserPlus className="size-3.5 text-muted-foreground" />
                Couple / contact name
              </Label>
              <Input
                id="ip-name"
                value={parsed.coupleName}
                onChange={(e) => set("coupleName", e.target.value)}
                placeholder="Kavya & Arnav"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ip-phone" className="flex items-center gap-1.5">
                  <Phone className="size-3.5 text-muted-foreground" />
                  Phone
                </Label>
                <Input
                  id="ip-phone"
                  value={parsed.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  inputMode="tel"
                  placeholder="+91 90000 12345"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ip-email" className="flex items-center gap-1.5">
                  <Mail className="size-3.5 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="ip-email"
                  value={parsed.email}
                  onChange={(e) => set("email", e.target.value)}
                  type="email"
                  placeholder="couple@email.com"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-muted-foreground" />
                  Event type
                </Label>
                <Select
                  value={parsed.eventType}
                  onValueChange={(v) => set("eventType", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  Source
                </Label>
                <Select
                  value={parsed.source}
                  onValueChange={(v) => set("source", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="ip-date" className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  Date
                </Label>
                <Input
                  id="ip-date"
                  value={parsed.date}
                  onChange={(e) => set("date", e.target.value)}
                  type={/^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? "date" : "text"}
                  placeholder="2026-12-12"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ip-guests" className="flex items-center gap-1.5">
                  <Users className="size-3.5 text-muted-foreground" />
                  Guests
                </Label>
                <Input
                  id="ip-guests"
                  value={parsed.guestCount}
                  onChange={(e) =>
                    set("guestCount", e.target.value.replace(/[^0-9]/g, ""))
                  }
                  inputMode="numeric"
                  placeholder="550"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ip-city" className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  City
                </Label>
                <Input
                  id="ip-city"
                  value={parsed.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Jaipur"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
              <p className="text-xs text-muted-foreground">
                Imports as a{" "}
                <span className="font-medium text-foreground">New enquiry</span>.
                Duplicates (same phone) are skipped.
              </p>
              <Button type="button" onClick={runImport} disabled={importing}>
                {importing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                Import lead
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PreviewEmpty({ pending }: { pending: boolean }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {pending ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <Sparkles className="size-6" />
          )}
        </span>
        <div>
          <p className="font-medium">
            {pending ? "Reading the enquiry…" : "Parsed fields appear here"}
          </p>
          <p className="mt-0.5 max-w-sm text-sm text-muted-foreground">
            {pending
              ? "Pulling out name, phone, date, guests, and source."
              : "Paste an enquiry on the left and hit Parse. Review the fields, fix anything, then import it into your leads pipeline."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
