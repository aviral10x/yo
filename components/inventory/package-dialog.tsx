"use client";

import { useActionState, useRef, useState } from "react";
import { Loader2, Package, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createPackage,
  updatePackage,
} from "@/app/dashboard/(panel)/inventory/actions";
import {
  PACKAGE_EVENT_TYPES,
  eventTypeLabel,
  type ActionState,
  type PackageRow,
} from "./inventory-types";

const INITIAL: ActionState = { ok: false, message: "" };

export function PackageDialog({
  pkg,
  liveDb,
  trigger,
}: {
  pkg?: PackageRow;
  liveDb: boolean;
  trigger?: React.ReactNode;
}) {
  const isEdit = !!pkg;
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const selected = new Set(pkg?.eventTypes ?? ["wedding"]);

  const [, action, pending] = useActionState(
    async (_prev: ActionState, formData: FormData) => {
      if (!liveDb) {
        toast.info("Connect a database to save packages.");
        setOpen(false);
        return INITIAL;
      }
      const result = isEdit
        ? await updatePackage(_prev, formData)
        : await createPackage(_prev, formData);
      if (result.ok) {
        toast.success(result.message);
        if (!isEdit) formRef.current?.reset();
        setOpen(false);
      } else if (result.message) {
        toast.error(result.message);
      }
      return result;
    },
    INITIAL,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Package className="size-4" />
            New package
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? (
              <Pencil className="size-4 text-primary" />
            ) : (
              <Package className="size-4 text-primary" />
            )}
            {isEdit ? "Edit package" : "New package"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update pricing, event types, and what's included."
              : "Bundle pricing and inclusions buyers can pick from a quote."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={action} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={pkg.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="pkg-name">Package name *</Label>
            <Input
              id="pkg-name"
              name="name"
              required
              placeholder="Gold"
              defaultValue={pkg?.name}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Event types</Label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {PACKAGE_EVENT_TYPES.map((value) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="eventTypes"
                    value={value}
                    defaultChecked={selected.has(value)}
                    className="size-4 rounded-[4px] border-input accent-primary"
                  />
                  {eventTypeLabel(value)}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="priceMin">Price from (₹)</Label>
              <Input
                id="priceMin"
                name="priceMin"
                inputMode="numeric"
                placeholder="800000"
                defaultValue={pkg?.priceMin ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priceMax">Price to (₹)</Label>
              <Input
                id="priceMax"
                name="priceMax"
                inputMode="numeric"
                placeholder="1200000"
                defaultValue={pkg?.priceMax ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="perPlate">Per plate (₹)</Label>
              <Input
                id="perPlate"
                name="perPlate"
                inputMode="numeric"
                placeholder="1200"
                defaultValue={pkg?.perPlate ?? ""}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inclusions">Inclusions</Label>
            <Textarea
              id="inclusions"
              name="inclusions"
              rows={4}
              placeholder={"One inclusion per line, e.g.\nVeg & non-veg buffet\nStage & mandap décor\nDJ till midnight"}
              defaultValue={(pkg?.inclusions ?? []).join("\n")}
            />
            <p className="text-xs text-muted-foreground">
              One per line. These show on the quote.
            </p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create package"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
