"use client";

import { useActionState, useRef, useState } from "react";
import { Loader2, MapPin, Pencil, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createSpace,
  updateSpace,
} from "@/app/dashboard/(panel)/inventory/actions";
import {
  SPACE_KINDS,
  type ActionState,
  type SpaceRow,
} from "./inventory-types";

const INITIAL: ActionState = { ok: false, message: "" };

export function SpaceDialog({
  space,
  liveDb,
  trigger,
}: {
  /** When provided, the dialog edits this space; otherwise it creates one. */
  space?: SpaceRow;
  liveDb: boolean;
  trigger?: React.ReactNode;
}) {
  const isEdit = !!space;
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [, action, pending] = useActionState(
    async (_prev: ActionState, formData: FormData) => {
      if (!liveDb) {
        toast.info("Connect a database to save spaces.");
        setOpen(false);
        return INITIAL;
      }
      const result = isEdit
        ? await updateSpace(_prev, formData)
        : await createSpace(_prev, formData);
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
            <Plus className="size-4" />
            Add space
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? (
              <Pencil className="size-4 text-primary" />
            ) : (
              <MapPin className="size-4 text-primary" />
            )}
            {isEdit ? "Edit space" : "Add a space"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update what this space seats and how it's described."
              : "List a lawn, hall, or combo so it can be quoted and booked."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={action} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={space.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="space-name">Space name *</Label>
            <Input
              id="space-name"
              name="name"
              required
              placeholder="The Grand Lawn"
              defaultValue={space?.name}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Kind</Label>
            <Select name="kind" defaultValue={space?.kind ?? "lawn"}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPACE_KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="seatedCapacity">Seated capacity</Label>
              <Input
                id="seatedCapacity"
                name="seatedCapacity"
                inputMode="numeric"
                placeholder="800"
                defaultValue={space?.seatedCapacity ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="floatingCapacity">Floating capacity</Label>
              <Input
                id="floatingCapacity"
                name="floatingCapacity"
                inputMode="numeric"
                placeholder="1200"
                defaultValue={space?.floatingCapacity ?? ""}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="space-notes">Notes</Label>
            <Textarea
              id="space-notes"
              name="notes"
              rows={2}
              placeholder="Rain backup, parking, valet, AV — anything worth flagging."
              defaultValue={space?.notes ?? ""}
            />
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
                "Add space"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
