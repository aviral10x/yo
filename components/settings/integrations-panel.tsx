"use client";

import {
  Bot,
  Globe,
  IndianRupee,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Integration = {
  key: string;
  name: string;
  description: string;
  icon: LucideIcon;
  tint: string;
};

const INTEGRATIONS: Integration[] = [
  {
    key: "whatsapp",
    name: "WhatsApp Business",
    description:
      "Auto-reply to enquiries and send proposals from your verified number.",
    icon: MessageCircle,
    tint: "bg-emerald-500/10 text-emerald-600",
  },
  {
    key: "razorpay",
    name: "Razorpay",
    description: "Collect deposits and installments with instant payment links.",
    icon: IndianRupee,
    tint: "bg-sky-500/10 text-sky-600",
  },
  {
    key: "google",
    name: "Google Business Profile",
    description:
      "Sync your photo pack and pull in reviews to respond from one place.",
    icon: Globe,
    tint: "bg-amber-500/10 text-amber-600",
  },
  {
    key: "anthropic",
    name: "Anthropic Claude",
    description: "Power AI reply drafts, content studio, and your growth audit.",
    icon: Bot,
    tint: "bg-violet-500/10 text-violet-600",
  },
];

export function IntegrationsPanel() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {INTEGRATIONS.map((it) => (
        <Card key={it.key} className="border-border/70">
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-10 items-center justify-center rounded-lg ${it.tint}`}
                >
                  <it.icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">{it.name}</p>
                  <Badge
                    variant="outline"
                    className="mt-1 gap-1.5 border-border bg-muted text-muted-foreground"
                  >
                    <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                    Not connected
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{it.description}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                toast.info(`Connect ${it.name}`, {
                  description:
                    "Add the credentials in your environment to enable this integration.",
                })
              }
            >
              Connect
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
