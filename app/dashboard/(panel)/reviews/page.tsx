import { MessageSquareReply, MessagesSquare, Star, ThumbsUp } from "lucide-react";
import { desc, eq } from "drizzle-orm";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Stat } from "@/components/dashboard/stat";
import { RequestReviewButton } from "@/components/reviews/request-review-button";
import { ReviewCard, type ReviewCardData } from "@/components/reviews/review-card";
import { getDb, schema } from "@/lib/db";
import { DEMO_REVIEWS } from "@/lib/demo-data";
import { getActiveOrg } from "@/lib/org";

export const metadata = {
  title: "Reviews · VenuePilot",
};

async function loadReviews(orgId: string): Promise<ReviewCardData[]> {
  const rows = await getDb()
    .select()
    .from(schema.reviews)
    .where(eq(schema.reviews.organizationId, orgId))
    .orderBy(desc(schema.reviews.createdAt));

  return rows.map((r) => ({
    id: r.id,
    author: r.author,
    rating: r.rating,
    text: r.text,
    source: r.source,
    response: r.response,
    respondedAt: r.respondedAt,
  }));
}

export default async function ReviewsPage() {
  const org = await getActiveOrg();
  const reviews: ReviewCardData[] = org
    ? await loadReviews(org.id)
    : DEMO_REVIEWS.map((r) => ({
        id: r.id,
        author: r.author,
        rating: r.rating,
        text: r.text,
        source: r.source,
        response: r.response ?? null,
        respondedAt: r.response ? "2026-06-15" : null,
      }));

  const total = reviews.length;
  const responded = reviews.filter((r) => Boolean(r.response)).length;
  const ratingSum = reviews.reduce((acc, r) => acc + (r.rating ?? 0), 0);
  const avgRating = total ? ratingSum / total : 0;
  const responseRate = total ? Math.round((responded / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Reviews"
        description={
          org
            ? "Reply to guests with on-brand drafts and keep your rating climbing."
            : "Showing demo reviews. Connect a database to manage your own."
        }
        action={<RequestReviewButton />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={Star}
          label="Average rating"
          value={total ? `${avgRating.toFixed(1)} / 5` : "—"}
          hint={`${total} review${total === 1 ? "" : "s"}`}
        />
        <Stat
          icon={MessagesSquare}
          label="Total reviews"
          value={total}
          hint="across all sources"
        />
        <Stat
          icon={ThumbsUp}
          label="Response rate"
          value={total ? `${responseRate}%` : "—"}
          hint={`${responded} of ${total} replied`}
        />
      </div>

      {total === 0 ? (
        <EmptyState
          icon={MessageSquareReply}
          title="No reviews yet"
          description="Request reviews from couples after their event, then reply with AI-assisted drafts to keep your rating high."
          action={<RequestReviewButton />}
        />
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">All reviews</h2>
            <span className="text-xs text-muted-foreground">
              newest first
            </span>
          </div>
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
