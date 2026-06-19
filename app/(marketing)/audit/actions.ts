"use server";

import { generateAudit, type AuditResult } from "@/lib/audit";

export type AuditState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; result: AuditResult };

function str(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : undefined;
}

export async function runAuditAction(
  _prev: AuditState,
  formData: FormData,
): Promise<AuditState> {
  const venue = str(formData.get("venue"));
  if (!venue) {
    return { status: "error", message: "Please enter your venue name." };
  }
  try {
    const result = await generateAudit({
      venue,
      city: str(formData.get("city")),
      url: str(formData.get("url")),
      instagram: str(formData.get("instagram")),
      phone: str(formData.get("phone")),
    });
    return { status: "success", result };
  } catch {
    return {
      status: "error",
      message: "We couldn't generate the audit just now. Please try again.",
    };
  }
}
