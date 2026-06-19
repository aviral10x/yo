"use client";

import { useState, useTransition } from "react";
import { Globe, Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";

import { setPublishState } from "@/app/dashboard/(panel)/website/actions";
import { Button } from "@/components/ui/button";

export function PublishToggle({ published }: { published: boolean }) {
  const [isPublished, setIsPublished] = useState(published);
  const [pending, startTransition] = useTransition();

  function onToggle() {
    const next = !isPublished;
    startTransition(async () => {
      const res = await setPublishState(next);
      if (res.ok) {
        setIsPublished(next);
        toast.success(res.message);
      } else {
        toast.message(res.message);
      }
    });
  }

  return (
    <Button
      onClick={onToggle}
      disabled={pending}
      variant={isPublished ? "outline" : "default"}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isPublished ? (
        <Globe className="size-4" />
      ) : (
        <Rocket className="size-4" />
      )}
      {isPublished ? "Unpublish" : "Publish site"}
    </Button>
  );
}
