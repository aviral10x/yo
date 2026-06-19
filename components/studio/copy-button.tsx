"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Copy-to-clipboard leaf. Shows a transient check + toast on success. The
 * "copied" tick is derived from local state and auto-resets via setTimeout
 * (no setState-in-effect).
 */
export function CopyButton({
  value,
  label = "Copy",
  toastLabel,
  size = "sm",
  variant = "outline",
  className,
}: {
  value: string;
  label?: string;
  toastLabel?: string;
  size?: "sm" | "icon";
  variant?: "outline" | "ghost" | "secondary";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${toastLabel ?? label} copied`);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — select and copy manually.");
    }
  }

  if (size === "icon") {
    return (
      <Button
        type="button"
        size="icon"
        variant={variant}
        onClick={handleCopy}
        aria-label={label}
        className={cn("size-8", className)}
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-600" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      onClick={handleCopy}
      className={className}
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {copied ? "Copied" : label}
    </Button>
  );
}
