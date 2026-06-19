"use client";

import { useActionState, useRef, useState } from "react";
import { Loader2, Plus, UserPlus } from "lucide-react";
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
import { EVENT_TYPE_LABELS, LEAD_SOURCE_LABELS, LEAD_STAGES } from "@/lib/constants";
import { createLead, type ActionState } from "@/app/dashboard/(panel)/leads/actions";

const INITIAL: ActionState = { ok: false, message: "" };

export function NewLeadDialog() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Wrap the server action so success/failure side effects (toast, reset,
  // close) run inline once it resolves — no result-watching effect needed.
  const [, action, pending] = useActionState(
    async (_prev: ActionState, formData: FormData) => {
      const result = await createLead(_prev, formData);
      if (result.ok) {
        toast.success(result.message);
        formRef.current?.reset();
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
        <Button>
          <Plus className="size-4" />
          New lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-4 text-primary" />
            Capture an enquiry
          </DialogTitle>
          <DialogDescription>
            Log a new wedding enquiry. You can move it through the pipeline as
            it warms up.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="coupleName">Couple / contact name *</Label>
            <Input
              id="coupleName"
              name="coupleName"
              required
              placeholder="Priya & Aman"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                name="phone"
                required
                inputMode="tel"
                placeholder="+91 98290 00000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="couple@email.com"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Event type</Label>
              <Select name="eventType" defaultValue="wedding">
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
              <Label>Source</Label>
              <Select name="source" defaultValue="direct">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="dateRequested">Requested date</Label>
              <Input id="dateRequested" name="dateRequested" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guestCount">Guest count</Label>
              <Input
                id="guestCount"
                name="guestCount"
                inputMode="numeric"
                placeholder="500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Starting stage</Label>
            <Select name="stage" defaultValue="new">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STAGES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              ) : (
                "Save enquiry"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
