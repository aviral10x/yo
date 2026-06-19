import { serve } from "inngest/next";

import { inngest } from "@/lib/inngest/client";
import {
  releaseExpiredHolds,
  sendLeadFollowUp,
} from "@/lib/inngest/functions";

// App Router requires exporting GET, POST and PUT (PUT is used for registration).
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendLeadFollowUp, releaseExpiredHolds],
});
