"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VENUE_TYPE_LABELS } from "@/lib/constants";
import { saveVenue, type VenueState } from "@/app/dashboard/(panel)/settings/actions";

export type VenueDefaults = {
  name: string;
  type: string;
  city: string;
  state: string;
};

export function VenueForm({
  defaults,
  live,
}: {
  defaults: VenueDefaults;
  live: boolean;
}) {
  const [state, action, pending] = useActionState<VenueState, FormData>(
    saveVenue,
    { status: "idle" },
  );

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">Venue details</CardTitle>
        <CardDescription>
          This information powers your public website, proposals, and Google
          Business Profile pack.
        </CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Venue name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={defaults.name}
              placeholder="Rosewood Garden"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="type">Venue type</Label>
              <Select name="type" defaultValue={defaults.type}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VENUE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                defaultValue={defaults.city}
                placeholder="Jaipur"
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:max-w-[calc(50%-0.625rem)]">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              name="state"
              defaultValue={defaults.state}
              placeholder="Rajasthan"
            />
          </div>

          {state.status === "error" && (
            <p className="text-sm text-red-600">{state.message}</p>
          )}
          {state.status === "success" && (
            <p className="flex items-center gap-1.5 text-sm text-emerald-600">
              <Check className="size-4" /> {state.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-6 justify-between border-t pt-6">
          <p className="text-xs text-muted-foreground">
            {live
              ? "Changes save to your live venue."
              : "Demo mode — connect a database to persist edits."}
          </p>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
