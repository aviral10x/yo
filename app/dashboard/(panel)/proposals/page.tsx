import {
  CalendarClock,
  CalendarDays,
  FileText,
  IndianRupee,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { eq } from "drizzle-orm";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Stat } from "@/components/dashboard/stat";
import { NewQuoteDialog } from "@/components/proposals/new-quote-dialog";
import { ProposalActions } from "@/components/proposals/proposal-actions";
import type {
  LeadOption,
  PackageOption,
  ProposalRow,
} from "@/components/proposals/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getDb, schema } from "@/lib/db";
import {
  DEMO_BOOKINGS,
  DEMO_LEADS,
  DEMO_PACKAGES,
  DEMO_PAYMENTS,
} from "@/lib/demo-data";
import { formatDate, formatINR, formatINRShort } from "@/lib/format";
import { getActiveOrg } from "@/lib/org";
import { razorpayConfigured } from "@/lib/razorpay";

const BOOKING_BADGE: Record<string, { label: string; className: string }> = {
  confirmed: {
    label: "Confirmed",
    className: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  },
  deposit: {
    label: "Deposit paid",
    className: "bg-sky-500/12 text-sky-700 dark:text-sky-400",
  },
  provisional: {
    label: "On hold",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
};

const PAYMENT_BADGE: Record<string, { label: string; className: string }> = {
  paid: {
    label: "Paid",
    className: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  failed: {
    label: "Failed",
    className: "bg-destructive/12 text-destructive",
  },
  refunded: {
    label: "Refunded",
    className: "bg-muted text-muted-foreground",
  },
};

const PROPOSAL_BADGE: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  sent: {
    label: "Sent",
    className: "bg-violet-500/12 text-violet-700 dark:text-violet-400",
  },
  hold: {
    label: "Provisional hold",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  deposit: {
    label: "Deposit link sent",
    className: "bg-sky-500/12 text-sky-700 dark:text-sky-400",
  },
  accepted: {
    label: "Accepted",
    className: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  },
};

export default async function ProposalsPage() {
  const org = await getActiveOrg();

  // --- Leads + packages feed the "New quote" builder -----------------------
  const leadRows = org
    ? await getDb()
        .select()
        .from(schema.leads)
        .where(eq(schema.leads.organizationId, org.id))
    : DEMO_LEADS;

  const leads: LeadOption[] = leadRows.map((l) => ({
    id: l.id,
    coupleName: l.coupleName ?? "New enquiry",
    phone: l.phone ?? "",
    eventType: l.eventType ?? "wedding",
    guestCount: l.guestCount ?? 0,
    dateRequested: l.dateRequested
      ? new Date(l.dateRequested as unknown as string).toISOString().slice(0, 10)
      : "",
  }));

  const packageRows = org
    ? await getDb()
        .select()
        .from(schema.packages)
        .where(eq(schema.packages.organizationId, org.id))
    : DEMO_PACKAGES;

  const packages: PackageOption[] = packageRows.map((p) => ({
    id: p.id,
    name: p.name,
    perPlate: Number(p.perPlate ?? 0),
    priceMin: Number(p.priceMin ?? 0),
    priceMax: Number(p.priceMax ?? 0),
    eventTypes: (p.eventTypes as string[] | null) ?? [],
  }));

  // --- Bookings + payments summary -----------------------------------------
  const bookings = org
    ? (
        await getDb()
          .select()
          .from(schema.bookings)
          .where(eq(schema.bookings.organizationId, org.id))
      ).map((b) => ({
        id: b.id,
        coupleName: "Booking",
        eventDate: b.eventDate as unknown as string,
        status: b.status,
        space: "—",
        amount: 0,
      }))
    : DEMO_BOOKINGS;

  const payments = org
    ? (
        await getDb()
          .select()
          .from(schema.payments)
          .where(eq(schema.payments.organizationId, org.id))
      ).map((p) => ({
        id: p.id,
        couple: "Payment",
        type: p.type,
        amount: Number(p.amount ?? 0),
        status: p.status,
        dueDate: p.dueDate as unknown as string,
      }))
    : DEMO_PAYMENTS;

  // --- Live proposals: derive from quoted/hold/deposit leads (demo) --------
  const pkgByEvent = (eventType: string) =>
    packages.find((p) => p.eventTypes.includes(eventType)) ?? packages[1] ?? packages[0];

  const proposals: ProposalRow[] = leads
    .filter((l) =>
      ["quoted", "hold", "deposit"].includes(
        leadRows.find((r) => r.id === l.id)?.stage ?? "",
      ),
    )
    .map((l) => {
      const pkg = pkgByEvent(l.eventType);
      const total =
        (pkg ? pkg.perPlate * l.guestCount : 0) + 400000; // catering + venue rental
      const stage = leadRows.find((r) => r.id === l.id)?.stage ?? "quoted";
      const status: ProposalRow["status"] =
        stage === "hold" ? "hold" : stage === "deposit" ? "deposit" : "sent";
      return {
        id: `qt_${l.id}`,
        coupleName: l.coupleName,
        contact: l.phone,
        leadId: l.id,
        eventDate: l.dateRequested,
        packageName: pkg?.name ?? "Custom",
        guestCount: l.guestCount,
        total,
        depositPct: 20,
        status,
      };
    });

  const totalQuoted = proposals.reduce((s, p) => s + p.total, 0);
  const depositsCollected = payments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);
  const depositsPending = payments
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + p.amount, 0);
  const activeHolds = bookings.filter((b) => b.status === "provisional").length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Proposals"
        description="Quotes, provisional holds, and deposit collection via Razorpay."
        action={<NewQuoteDialog leads={leads} packages={packages} />}
      />

      {!razorpayConfigured && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-50/60 px-4 py-3 text-sm dark:bg-amber-500/10">
          <Wallet className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-amber-800 dark:text-amber-300">
            <span className="font-medium">Demo payments mode.</span> Deposit links
            are drafted but won&apos;t charge until you add{" "}
            <code className="rounded bg-amber-500/15 px-1 py-0.5 text-xs">
              RAZORPAY_KEY_ID
            </code>{" "}
            and{" "}
            <code className="rounded bg-amber-500/15 px-1 py-0.5 text-xs">
              RAZORPAY_KEY_SECRET
            </code>
            .
          </p>
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={FileText}
          label="Open proposals"
          value={proposals.length}
          hint="quoted & on hold"
        />
        <Stat
          icon={IndianRupee}
          label="Value quoted"
          value={formatINRShort(totalQuoted)}
          hint="across open quotes"
        />
        <Stat
          icon={Wallet}
          label="Deposits collected"
          value={formatINRShort(depositsCollected)}
          hint={`${formatINRShort(depositsPending)} pending`}
        />
        <Stat
          icon={CalendarClock}
          label="Active holds"
          value={activeHolds}
          hint="provisional bookings"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Proposals & quotes</h2>
            <span className="text-xs text-muted-foreground">
              hold → deposit → confirmed
            </span>
          </div>

          {proposals.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No proposals yet"
              description="Build a quote from a lead, place a hold, then send a deposit link to lock the date."
              action={<NewQuoteDialog leads={leads} packages={packages} />}
            />
          ) : (
            <div className="space-y-3">
              {proposals.map((p) => {
                const badge = PROPOSAL_BADGE[p.status];
                const deposit = Math.round((p.total * p.depositPct) / 100);
                return (
                  <Card key={p.id} className="border-border/70">
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{p.coupleName}</p>
                            <Badge
                              variant="secondary"
                              className={badge.className}
                            >
                              {badge.label}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {p.packageName} · {p.guestCount} guests ·{" "}
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="size-3" />
                              {formatDate(p.eventDate)}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold tabular-nums">
                            {formatINR(p.total)}
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {formatINR(deposit)} deposit ({p.depositPct}%)
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <ProposalActions row={p} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base">Bookings</CardTitle>
              <CardDescription>Holds and confirmed dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {bookings.map((b) => {
                  const badge =
                    BOOKING_BADGE[b.status] ?? BOOKING_BADGE.provisional;
                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {b.coupleName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(b.eventDate)}
                          {b.space !== "—" ? ` · ${b.space}` : ""}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={badge.className}
                      >
                        {badge.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ReceiptText className="size-4 text-primary" />
                Payments
              </CardTitle>
              <CardDescription>Deposits & installments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {payments.map((pm) => {
                  const badge =
                    PAYMENT_BADGE[pm.status] ?? PAYMENT_BADGE.pending;
                  return (
                    <div
                      key={pm.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {pm.couple}
                        </p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {pm.type} · due {formatDate(pm.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {formatINRShort(pm.amount)}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`mt-0.5 ${badge.className}`}
                        >
                          {badge.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
