import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { AUDIT_DIMENSIONS } from "@/lib/audit";
import { AuditForm } from "./audit-form";

export const metadata: Metadata = {
  title: "Free AI venue growth audit",
  description:
    "Get a free, AI-generated audit of your wedding venue's online presence — Google profile, photos, reviews, packages, availability, and enquiry flow — with prioritized fixes.",
};

export default function AuditPage() {
  return (
    <main>
      <section className="border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-5xl px-6 py-14 text-center">
          <Badge variant="secondary" className="mb-4 gap-1.5">
            <Sparkles className="size-3.5" /> AI-powered · free
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            How much business is your venue losing online?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
            Our AI scores your venue across the {AUDIT_DIMENSIONS.length} things
            that decide whether couples book you directly — and shows you exactly
            what to fix first.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[1fr_1.1fr]">
        <div className="lg:pt-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            What we score
          </h2>
          <ul className="mt-4 space-y-3">
            {AUDIT_DIMENSIONS.map((d, i) => (
              <li key={d.key} className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {i + 1}
                </span>
                <span>{d.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-sm text-sm text-muted-foreground">
            Runs on Claude (also available via AWS Bedrock). When you provide a
            link, the audit reads your actual site to ground its findings.
          </p>
        </div>

        <AuditForm />
      </section>
    </main>
  );
}
