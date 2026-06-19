"use client";

import { useTransition } from "react";
import { CalendarClock, Copy, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  placeHoldAction,
  sendDepositLinkAction,
  type ActionResult,
} from "@/app/dashboard/(panel)/proposals/actions";
import type { ProposalRow } from "./types";

export function ProposalActions({ row }: { row: ProposalRow }) {
  const [holding, startHold] = useTransition();
  const [linking, startLink] = useTransition();

  function handleHold() {
    const fd = new FormData();
    fd.set("couple", row.coupleName);
    fd.set("eventDate", row.eventDate);
    if (row.leadId) fd.set("leadId", row.leadId);

    startHold(async () => {
      const res = await placeHoldAction(null, fd);
      announce(res);
    });
  }

  function handleDepositLink() {
    const fd = new FormData();
    fd.set("couple", row.coupleName);
    fd.set("contact", row.contact);
    fd.set("total", String(row.total));
    fd.set("depositPct", String(row.depositPct));
    if (row.leadId) fd.set("leadId", row.leadId);

    startLink(async () => {
      const res = await sendDepositLinkAction(null, fd);
      announce(res);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleHold}
        disabled={holding || row.status === "deposit" || row.status === "accepted"}
      >
        {holding ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <CalendarClock className="size-3.5" />
        )}
        Place hold
      </Button>
      <Button size="sm" onClick={handleDepositLink} disabled={linking}>
        {linking ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Link2 className="size-3.5" />
        )}
        Send deposit link
      </Button>
    </div>
  );
}

function announce(res: ActionResult) {
  if (!res.ok) {
    toast.error(res.message);
    return;
  }

  if (res.url && res.url !== "#" && !res.demo) {
    const url = res.url;
    toast.success(res.message, {
      description: url,
      action: {
        label: (
          <span className="inline-flex items-center gap-1">
            <Copy className="size-3" /> Copy
          </span>
        ),
        onClick: () => {
          void navigator.clipboard?.writeText(url);
          toast.success("Payment link copied");
        },
      },
    });
    return;
  }

  if (res.demo) {
    toast.info(res.message, {
      description: "Add RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET to send real links.",
    });
    return;
  }

  toast.success(res.message);
}
