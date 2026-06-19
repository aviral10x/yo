"use client";

import { useState, useTransition } from "react";
import { Check, Package, Pencil, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatINR, formatINRShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { togglePackageActive } from "@/app/dashboard/(panel)/inventory/actions";
import { PackageDialog } from "./package-dialog";
import { eventTypeLabel, type PackageRow } from "./inventory-types";

function priceRange(pkg: PackageRow): string {
  if (pkg.priceMin && pkg.priceMax) {
    return `${formatINRShort(pkg.priceMin)} – ${formatINRShort(pkg.priceMax)}`;
  }
  if (pkg.priceMin) return `From ${formatINRShort(pkg.priceMin)}`;
  if (pkg.priceMax) return `Up to ${formatINRShort(pkg.priceMax)}`;
  return "On request";
}

function PackageCard({ pkg, liveDb }: { pkg: PackageRow; liveDb: boolean }) {
  const [active, setActive] = useState(pkg.active);
  const [pending, startTransition] = useTransition();

  function handleToggle(next: boolean) {
    const previous = active;
    setActive(next);

    if (!liveDb) {
      toast.info("Connect a database to save packages.");
      setActive(previous);
      return;
    }

    startTransition(async () => {
      const res = await togglePackageActive(pkg.id, next);
      if (res.ok) {
        toast.success(res.message);
      } else {
        setActive(previous);
        toast.error(res.message);
      }
    });
  }

  return (
    <Card
      className={cn(
        "border-border/70 gap-0 transition-opacity",
        !active && "opacity-70",
      )}
    >
      <CardHeader className="gap-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-semibold">{pkg.name}</h3>
            <p className="mt-0.5 text-lg font-semibold tabular-nums">
              {priceRange(pkg)}
            </p>
          </div>
          <Switch
            checked={active}
            onCheckedChange={handleToggle}
            disabled={pending}
            aria-label={`${pkg.name} ${active ? "active" : "hidden"}`}
          />
        </div>
        {pkg.eventTypes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {pkg.eventTypes.map((t) => (
              <Badge key={t} variant="secondary" className="font-normal">
                {eventTypeLabel(t)}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        {pkg.perPlate ? (
          <div className="flex items-center gap-2 text-sm">
            <UtensilsCrossed className="size-4 text-muted-foreground" />
            <span className="font-medium tabular-nums">
              {formatINR(pkg.perPlate)}
            </span>
            <span className="text-muted-foreground">/ plate</span>
          </div>
        ) : null}

        {pkg.inclusions.length > 0 ? (
          <ul className="space-y-1.5">
            {pkg.inclusions.slice(0, 6).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
            {pkg.inclusions.length > 6 && (
              <li className="pl-[1.375rem] text-xs text-muted-foreground">
                +{pkg.inclusions.length - 6} more
              </li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No inclusions listed.</p>
        )}
      </CardContent>

      <CardFooter className="mt-auto justify-between border-t pt-4">
        <span className="text-xs text-muted-foreground">
          {active ? "Live on quotes" : "Hidden from quotes"}
        </span>
        <PackageDialog
          pkg={pkg}
          liveDb={liveDb}
          trigger={
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Pencil className="size-3.5" />
              Edit
            </Button>
          }
        />
      </CardFooter>
    </Card>
  );
}

export function PackagesGrid({
  packages,
  liveDb,
}: {
  packages: PackageRow[];
  liveDb: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          Packages
          <span className="ml-2 font-normal text-muted-foreground tabular-nums">
            {packages.length}
          </span>
        </h2>
        <PackageDialog liveDb={liveDb} />
      </div>

      {packages.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No packages yet"
          description="Bundle your pricing and inclusions so enquiries get a clear, on-brand quote."
          action={<PackageDialog liveDb={liveDb} />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} liveDb={liveDb} />
          ))}
        </div>
      )}
    </div>
  );
}
