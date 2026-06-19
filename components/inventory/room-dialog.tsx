"use client";

import { useActionState, useRef, useState } from "react";
import { BedDouble, Loader2, Pencil, Plus } from "lucide-react";
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
  createRoom,
  updateRoom,
} from "@/app/dashboard/(panel)/inventory/actions";
import { type ActionState, type RoomRow } from "./inventory-types";

const INITIAL: ActionState = { ok: false, message: "" };

export function RoomDialog({
  room,
  liveDb,
  trigger,
}: {
  room?: RoomRow;
  liveDb: boolean;
  trigger?: React.ReactNode;
}) {
  const isEdit = !!room;
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [, action, pending] = useActionState(
    async (_prev: ActionState, formData: FormData) => {
      if (!liveDb) {
        toast.info("Connect a database to save room blocks.");
        setOpen(false);
        return INITIAL;
      }
      const result = isEdit
        ? await updateRoom(_prev, formData)
        : await createRoom(_prev, formData);
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
            Add room block
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? (
              <Pencil className="size-4 text-primary" />
            ) : (
              <BedDouble className="size-4 text-primary" />
            )}
            {isEdit ? "Edit room block" : "Add a room block"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the room count and nightly tariff."
              : "List on-site stay so guests can be quoted accommodation."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={action} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={room.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="room-name">Block name *</Label>
            <Input
              id="room-name"
              name="name"
              required
              placeholder="Garden View Rooms"
              defaultValue={room?.name}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="room-count">Room count</Label>
              <Input
                id="room-count"
                name="count"
                inputMode="numeric"
                placeholder="24"
                defaultValue={room?.count ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="room-tariff">Nightly tariff (₹)</Label>
              <Input
                id="room-tariff"
                name="tariff"
                inputMode="numeric"
                placeholder="6500"
                defaultValue={room?.tariff ?? ""}
              />
            </div>
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
                "Add room block"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
