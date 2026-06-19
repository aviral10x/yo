"use client";

import { useState, useTransition } from "react";
import {
  CalendarDays,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_TYPE_LABELS, LEAD_SOURCE_LABELS, LEAD_STAGES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { updateLeadStage } from "@/app/dashboard/(panel)/leads/actions";
import { STAGE_LABEL, STAGE_TONE, type LeadRow, type LeadStage } from "./lead-types";

function telHref(phone: string) {
  return `tel:${phone.replace(/[^+0-9]/g, "")}`;
}

function waHref(phone: string) {
  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

export function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
  liveDb,
}: {
  lead: LeadRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Whether a real DB is connected (controls whether stage edits persist). */
  liveDb: boolean;
}) {
  const [stage, setStage] = useState<LeadStage>(lead?.stage ?? "new");
  const [pending, startTransition] = useTransition();

  if (!lead) return null;

  const tone = STAGE_TONE[stage] ?? STAGE_TONE.new;

  function handleStageChange(next: string) {
    if (!lead) return;
    const previous = stage;
    setStage(next as LeadStage);

    if (!liveDb) {
      toast.info("Connect a database to save pipeline changes.");
      return;
    }

    startTransition(async () => {
      const res = await updateLeadStage(lead.id, next);
      if (res.ok) {
        toast.success(`Moved to ${STAGE_LABEL[next as LeadStage]}.`);
      } else {
        setStage(previous);
        toast.error(res.message);
      }
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (o && lead) setStage(lead.stage);
      }}
    >
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                tone.badge,
              )}
            >
              <span className={cn("size-1.5 rounded-full", tone.dot)} />
              {STAGE_LABEL[stage]}
            </span>
            <span className="text-xs text-muted-foreground">
              Added {formatDate(lead.createdAt)}
            </span>
          </div>
          <SheetTitle className="text-xl">{lead.coupleName}</SheetTitle>
          <SheetDescription>
            {EVENT_TYPE_LABELS[lead.eventType] ?? "Event"} ·{" "}
            {LEAD_SOURCE_LABELS[lead.source] ?? "Direct"} enquiry
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div className="space-y-4">
            <Field icon={Phone} label="Phone">
              <a href={telHref(lead.phone)} className="hover:text-primary">
                {lead.phone}
              </a>
            </Field>
            {lead.email && (
              <Field icon={Mail} label="Email">
                <a
                  href={`mailto:${lead.email}`}
                  className="hover:text-primary break-all"
                >
                  {lead.email}
                </a>
              </Field>
            )}
            <Field icon={CalendarDays} label="Requested date">
              {formatDate(lead.dateRequested)}
            </Field>
            <Field icon={Users} label="Guests">
              <span className="tabular-nums">
                {lead.guestCount ? lead.guestCount.toLocaleString("en-IN") : "—"}
              </span>
            </Field>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Pipeline stage</p>
            <p className="text-xs text-muted-foreground">
              Update where this enquiry sits. Stage changes are logged to your
              activity feed.
            </p>
            <Select
              value={stage}
              onValueChange={handleStageChange}
              disabled={pending}
            >
              <SelectTrigger className="w-full">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      STAGE_TONE[stage]?.dot ?? "bg-primary",
                    )}
                  />
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent>
                {LEAD_STAGES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          STAGE_TONE[s.value]?.dot ?? "bg-primary",
                        )}
                      />
                      {s.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {pending && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Saving…
              </p>
            )}
          </div>
        </div>

        <SheetFooter className="border-t">
          <Button asChild className="w-full">
            <a href={waHref(lead.phone)} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="size-4" />
              Reply on WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <a href={telHref(lead.phone)}>
              <Phone className="size-4" />
              Call now
            </a>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
