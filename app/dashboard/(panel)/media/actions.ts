"use server";

import { logActivity } from "@/lib/activity";
import { getActiveOrg } from "@/lib/org";

export type UploadResult = { ok: boolean; message: string };

/**
 * Upload affordance stub. Real file ingestion (blob storage + AI auto-tagging
 * via Claude vision) lands in a later phase; here we record intent so the
 * activity stream and UX are wired end-to-end.
 */
export async function requestUpload(category: string): Promise<UploadResult> {
  const org = await getActiveOrg();
  if (!org) {
    return {
      ok: false,
      message: "Connect a database to upload and auto-tag photos.",
    };
  }
  await logActivity({
    organizationId: org.id,
    type: "media.upload_requested",
    payload: { category },
  });
  return {
    ok: true,
    message: "Uploader is being prepared — your file will be auto-tagged.",
  };
}
