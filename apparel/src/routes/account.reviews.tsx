import type { MyReview, WritableReview } from "@sayren/storefront-sdk";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AccountLayout } from "../components/account/account-layout";
import { ReviewSheet } from "../components/account/review-sheet";
import { ProductImage } from "../components/product/product-image";
import { Button } from "../components/ui/button";
import { EmptyState } from "../components/ui/empty-state";
import { m } from "../i18n";
import { createReview, removeReview, updateReview } from "../lib/account-actions";
import { myReviewsQuery } from "../lib/account-queries";
import { requireMember } from "../lib/require-member";

export const Route = createFileRoute("/account/reviews")({
  loader: async ({ context }) => {
    await requireMember(context.queryClient, "/account/reviews");
    return context.queryClient.ensureQueryData(myReviewsQuery());
  },
  head: () => ({ meta: [{ title: m.account_reviews() }] }),
  component: ReviewsPage,
});

type Editing = { kind: "new"; item: WritableReview } | { kind: "edit"; review: MyReview } | null;

function ReviewsPage() {
  const { writable, mine } = useSuspenseQuery(myReviewsQuery()).data;
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Editing>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: myReviewsQuery().queryKey });

  return (
    <AccountLayout title={m.account_reviews()}>
      <h2 className="pb-3 font-semibold text-body-lg">{m.reviews_writable()}</h2>
      {writable.length === 0 ? (
        <EmptyState message={m.reviews_writable_empty()} />
      ) : (
        <ul className="border-line border-t">
          {writable.map((item) => (
            <li
              key={item.orderItemId}
              className="flex items-center gap-3 border-line border-b py-3"
            >
              <div className="w-14 shrink-0">
                <ProductImage src={item.thumbnailUrl} alt={item.productName} />
              </div>
              <div className="min-w-0 flex-1 text-meta">
                <p className="line-clamp-2 break-words text-body">{item.productName}</p>
                {item.optionName ? <p className="text-sub">{item.optionName}</p> : null}
              </div>
              <Button
                variant="secondary"
                className="min-h-11 px-4 text-meta"
                onClick={() => setEditing({ kind: "new", item })}
              >
                {m.reviews_write()}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <h2 className="pt-10 pb-3 font-semibold text-body-lg">{m.reviews_mine()}</h2>
      {mine.length === 0 ? (
        <EmptyState message={m.reviews_mine_empty()} />
      ) : (
        <ul className="border-line border-t">
          {mine.map((review) => (
            <li
              key={review.reviewId}
              className="flex flex-col gap-1.5 border-line border-b py-4 text-meta"
            >
              <p className="font-semibold text-body">{review.productName}</p>
              {review.optionName ? <p className="text-sub">{review.optionName}</p> : null}
              <p>
                <span className="sr-only">{m.reviews_rating({ rating: review.rating })}</span>
                <span aria-hidden>{"★".repeat(review.rating)}</span>
              </p>
              <p className="whitespace-pre-line break-words text-body">{review.content}</p>
              {review.sellerReply ? (
                <p className="border-line border-l-2 pl-3 text-sub">{review.sellerReply.content}</p>
              ) : null}
              <div className="flex gap-4">
                {review.editable ? (
                  <Button variant="text" onClick={() => setEditing({ kind: "edit", review })}>
                    {m.review_edit()}
                  </Button>
                ) : null}
                <Button
                  variant="text"
                  onClick={async () => {
                    const result = await removeReview({
                      data: { reviewId: review.reviewId },
                    }).catch(() => null);
                    if (result?.ok) await refresh();
                  }}
                >
                  {m.common_delete()}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing ? (
        <ReviewSheet
          open
          title={editing.kind === "new" ? m.reviews_write() : m.review_edit()}
          initial={
            editing.kind === "edit"
              ? { rating: editing.review.rating, content: editing.review.content }
              : undefined
          }
          onClose={() => setEditing(null)}
          onSubmit={async (value) => {
            const result =
              editing.kind === "new"
                ? await createReview({ data: { orderItemId: editing.item.orderItemId, ...value } })
                : await updateReview({ data: { reviewId: editing.review.reviewId, ...value } });
            if (result.ok) {
              await refresh();
              if (!("rewardPoint" in result) || !result.rewardPoint) setEditing(null);
            }
            return result;
          }}
        />
      ) : null}
    </AccountLayout>
  );
}
