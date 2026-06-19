"use client";

import { useActionState, useRef, useState } from "react";
import { Loader2, Mail, Plus, UserPlus } from "lucide-react";
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
import { inviteMember, type ActionState } from "@/app/dashboard/(panel)/team/actions";
import { ROLE_PERMISSIONS, ROLES } from "./team-types";

const INITIAL: ActionState = { ok: false, message: "" };

export function InviteMemberDialog({ liveDb }: { liveDb: boolean }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [, action, pending] = useActionState(
    async (_prev: ActionState, formData: FormData) => {
      if (!liveDb) {
        toast.info("Connect a database to invite teammates.");
        return _prev;
      }
      const result = await inviteMember(_prev, formData);
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
          Invite member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-4 text-primary" />
            Invite a teammate
          </DialogTitle>
          <DialogDescription>
            They&apos;ll get an email to join your venue. You can change their
            role anytime.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Work email *</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="invite-email"
                name="email"
                type="email"
                required
                placeholder="teammate@rosewood.in"
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select name="role" defaultValue="staff">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {ROLE_PERMISSIONS.staff.summary}
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
                  Sending…
                </>
              ) : (
                "Send invite"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
