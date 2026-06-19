import type { Metadata } from "next";
import { Mail, MapPin, MessageSquare } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Talk to us</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Building VenuePilot for wedding lawns, banquet gardens, and resorts across
        India. Reach out — we read everything.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <Mail className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-sm">Email</CardTitle>
            <a
              href="mailto:hello@venuepilot.in"
              className="mt-1 block text-sm text-muted-foreground hover:text-foreground"
            >
              hello@venuepilot.in
            </a>
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <MessageSquare className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-sm">WhatsApp</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">By request</p>
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <MapPin className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-sm">Based in</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">India</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
