"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, CheckCircle2, ExternalLink, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { GBP_CHECKLIST } from "@/components/website/templates";
import { MEDIA_PACK_CHECKLIST } from "@/lib/constants";
import { cn } from "@/lib/utils";

type CheckMap = Record<string, boolean>;

const STORAGE_KEY = "vp.gbp.checks";

function ProgressRing({ pct }: { pct: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative size-16 shrink-0">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={r}
          className="fill-none stroke-muted"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r={r}
          className="fill-none stroke-primary transition-all duration-500"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">
        {pct}%
      </span>
    </div>
  );
}

function ChecklistRow({
  id,
  label,
  hint,
  checked,
  onToggle,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
        checked
          ? "border-primary/30 bg-primary/5"
          : "border-border/70 hover:bg-muted/40",
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onToggle(v === true)}
        className="mt-0.5"
      />
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-medium leading-snug",
            checked && "text-muted-foreground line-through",
          )}
        >
          {label}
        </p>
        {hint && (
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    </label>
  );
}

export function GbpToolkit({ mapsUrl }: { mapsUrl: string }) {
  const [checks, setChecks] = useState<CheckMap>({});
  const [hydrated, setHydrated] = useState(false);

  // Persist self-assessment locally so progress survives navigation.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage (avoids SSR mismatch)
      if (raw) setChecks(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
    } catch {
      /* ignore */
    }
  }, [checks, hydrated]);

  const toggle = (key: string, v: boolean) =>
    setChecks((c) => ({ ...c, [key]: v }));

  const photoDone = useMemo(
    () =>
      MEDIA_PACK_CHECKLIST.filter((m) => checks[`photo:${m.category}`]).length,
    [checks],
  );
  const gbpDone = useMemo(
    () => GBP_CHECKLIST.filter((g) => checks[`gbp:${g.id}`]).length,
    [checks],
  );

  const photoPct = Math.round((photoDone / MEDIA_PACK_CHECKLIST.length) * 100);
  const gbpPct = Math.round((gbpDone / GBP_CHECKLIST.length) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* GBP completeness */}
      <Card className="border-border/70">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-4 text-primary" />
                Google Business Profile
              </CardTitle>
              <CardDescription className="mt-1">
                The fastest free channel for couples searching nearby.
              </CardDescription>
            </div>
            <ProgressRing pct={gbpPct} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {GBP_CHECKLIST.map((g) => (
            <ChecklistRow
              key={g.id}
              id={`gbp:${g.id}`}
              label={g.label}
              hint={g.hint}
              checked={!!checks[`gbp:${g.id}`]}
              onToggle={(v) => toggle(`gbp:${g.id}`, v)}
            />
          ))}
          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-xs text-muted-foreground">
              {gbpDone}/{GBP_CHECKLIST.length} complete
            </p>
            <Button asChild variant="outline" size="sm">
              <a href={mapsUrl} target="_blank" rel="noreferrer">
                Open profile <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Photo pack */}
      <Card className="border-border/70">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Camera className="size-4 text-primary" />
                Photo pack
              </CardTitle>
              <CardDescription className="mt-1">
                The 12 shots every wedding venue listing needs.
              </CardDescription>
            </div>
            <ProgressRing pct={photoPct} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5">
          <div className="grid gap-2 sm:grid-cols-2">
            {MEDIA_PACK_CHECKLIST.map((m) => {
              const key = `photo:${m.category}`;
              const checked = !!checks[key];
              return (
                <label
                  key={m.category}
                  htmlFor={key}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors",
                    checked
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/70 hover:bg-muted/40",
                  )}
                >
                  <Checkbox
                    id={key}
                    checked={checked}
                    onCheckedChange={(v) => toggle(key, v === true)}
                  />
                  <span
                    className={cn(
                      "text-sm",
                      checked && "text-muted-foreground line-through",
                    )}
                  >
                    {m.label}
                  </span>
                </label>
              );
            })}
          </div>
          <div className="flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-primary" />
            <Label className="font-normal text-muted-foreground">
              {photoDone}/{MEDIA_PACK_CHECKLIST.length} shots staged — upload in
              the Media section.
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
