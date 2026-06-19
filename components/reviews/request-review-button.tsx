"use client";

import { useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { requestReview } from "@/app/dashboard/(panel)/reviews/actions";

export function RequestReviewButton() {
  const [pending, start] = useTransition();

  function handleClick() {
    start(async () => {
      const result = await requestReview();
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Button onClick={handleClick} disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Sending…
        </>
      ) : (
        <>
          <Send className="size-4" /> Request a review
        </>
      )}
    </Button>
  );
}
