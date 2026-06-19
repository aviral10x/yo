"use client";

import { Check, Copy, Link2, Mail, Plug } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CONNECTORS,
  EMAIL_CONNECTOR,
  type Connector,
} from "@/components/imports/import-types";
import { cn } from "@/lib/utils";

export function ConnectorsPanel() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONNECTORS.map((c) => (
          <ConnectorCard key={c.id} connector={c} />
        ))}
      </div>

      <EmailForwardingCard />
    </div>
  );
}

function ConnectorCard({ connector }: { connector: Connector }) {
  const Icon = connector.icon;

  function connect() {
    toast.info(`${connector.name} connector is coming soon.`, {
      description:
        "Until then, paste enquiries on the Import tab — parsing is fully live.",
    });
  }

  return (
    <Card className="border-border/70">
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-lg",
              connector.tone,
            )}
          >
            <Icon className="size-5" />
          </span>
          <Badge variant="outline" className="gap-1.5 text-muted-foreground">
            <span className="size-1.5 rounded-full bg-muted-foreground/50" />
            Not connected
          </Badge>
        </div>
        <div className="flex-1">
          <p className="font-medium">{connector.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{connector.blurb}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={connect}
          className="w-full"
        >
          <Plug className="size-4" />
          Connect
        </Button>
      </CardContent>
    </Card>
  );
}

function EmailForwardingCard() {
  const Icon = EMAIL_CONNECTOR.icon;

  function copyInbox() {
    navigator.clipboard
      .writeText(EMAIL_CONNECTOR.inbox)
      .then(() => toast.success("Forwarding address copied"))
      .catch(() => toast.error("Couldn't copy — copy it manually."));
  }

  function setUp() {
    toast.info("Email forwarding setup is coming soon.", {
      description: "We'll auto-parse every forwarded enquiry into your pipeline.",
    });
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
              EMAIL_CONNECTOR.tone,
            )}
          >
            <Icon className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{EMAIL_CONNECTOR.name}</p>
              <Badge variant="secondary" className="gap-1.5">
                <Check className="size-3" />
                Available
              </Badge>
            </div>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {EMAIL_CONNECTOR.blurb}
            </p>
            <button
              type="button"
              onClick={copyInbox}
              className="mt-2 inline-flex items-center gap-2 rounded-md border border-border/70 bg-background px-2.5 py-1 font-mono text-xs text-foreground transition-colors hover:bg-accent"
            >
              <Mail className="size-3.5 text-primary" />
              {EMAIL_CONNECTOR.inbox}
              <Copy className="size-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={setUp}
          className="shrink-0 bg-background"
        >
          <Link2 className="size-4" />
          Set up forwarding
        </Button>
      </CardContent>
    </Card>
  );
}
