"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { saveWebsite, type WebsiteState } from "@/app/dashboard/(panel)/website/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WEBSITE_TEMPLATES } from "@/components/website/templates";
import { cn } from "@/lib/utils";

type Initial = {
  templateId: string;
  story: string;
  amenities: string[];
  packageNote: string;
};

export function WebsiteEditor({ initial }: { initial: Initial }) {
  const [template, setTemplate] = useState(initial.templateId);
  const [state, action, pending] = useActionState<WebsiteState, FormData>(
    saveWebsite,
    { ok: false, message: "" },
  );

  // Surface the result of the most recent save as a toast.
  const lastMessage = useRef<string>("");
  useEffect(() => {
    if (state.message && state.message !== lastMessage.current) {
      lastMessage.current = state.message;
      (state.ok ? toast.success : toast.message)(state.message);
    }
  }, [state]);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="templateId" value={template} />

      {/* Template picker */}
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Choose a template</CardTitle>
          <CardDescription>
            Pick a look that fits your venue. You can switch any time — your
            content stays.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WEBSITE_TEMPLATES.map((t) => {
              const active = template === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  aria-pressed={active}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border text-left transition-all",
                    active
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border/70 hover:border-primary/40 hover:shadow-sm",
                  )}
                >
                  {/* Mini browser preview */}
                  <div
                    className={cn(
                      "relative h-24 bg-gradient-to-br p-2.5",
                      t.swatch,
                    )}
                  >
                    <div className="flex gap-1">
                      <span className="size-1.5 rounded-full bg-black/15" />
                      <span className="size-1.5 rounded-full bg-black/15" />
                      <span className="size-1.5 rounded-full bg-black/15" />
                    </div>
                    <div className="mt-2.5 space-y-1.5">
                      <div className={cn("h-2 w-1/2 rounded-full", t.accent)} />
                      <div className="h-1.5 w-3/4 rounded-full bg-black/10" />
                      <div className="h-1.5 w-2/3 rounded-full bg-black/10" />
                    </div>
                    {active && (
                      <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="size-3" />
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{t.name}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {t.bestFor}
                      </span>
                    </div>
                    <p className="text-xs leading-snug text-muted-foreground">
                      {t.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content fields */}
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Website content</CardTitle>
          <CardDescription>
            This copy powers your public venue page. Write the way couples speak.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="story">Your venue story</Label>
            <Textarea
              id="story"
              name="story"
              rows={5}
              defaultValue={initial.story}
              placeholder="Set on 12 acres of manicured gardens, Rosewood Garden has hosted over 400 weddings. Our lawn seats 800 with a covered rain-backup hall and a dedicated bridal suite…"
            />
            <p className="text-xs text-muted-foreground">
              2–4 sentences on what makes your venue special.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amenities">Amenities</Label>
            <Textarea
              id="amenities"
              name="amenities"
              rows={3}
              defaultValue={initial.amenities.join(", ")}
              placeholder="Valet parking, In-house catering, Bridal suite, Rain backup hall, DJ & sound, Power backup"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated. These render as chips on your site.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="packageNote">Package ranges note</Label>
            <Textarea
              id="packageNote"
              name="packageNote"
              rows={2}
              defaultValue={initial.packageNote}
              placeholder="Weddings from ₹8L (Silver) to ₹40L (Platinum). Per-plate ₹1,200–₹2,800. Custom packages on request."
            />
            <p className="text-xs text-muted-foreground">
              A friendly summary shown above your detailed packages.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="size-4" /> Save changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
