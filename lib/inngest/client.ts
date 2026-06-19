import { Inngest } from "inngest";

// Event/signing keys are auto-read from INNGEST_EVENT_KEY / INNGEST_SIGNING_KEY
// in production; not needed against the local Dev Server (`npx inngest-cli dev`).
export const inngest = new Inngest({ id: "venuepilot" });
