import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AccountLayout } from "../../components/account/account-layout";
import { ProductImage } from "../../components/product-image";
import {
  Button,
  Chip,
  EmptyState,
  ErrorText,
  SectionTitle,
  Stars,
  Textarea,
} from "../../components/ui";
import { useMyReviews, useWritableReviews } from "../../hooks/use-account";
import { m } from "../../i18n";
import { createReview, removeReview, updateReview } from "../../lib/account-actions";
import { myReviewsQuery, writableReviewsQuery } from "../../lib/account-queries";
import { formatDate } from "../../lib/format";
import { requireMember } from "../../lib/guards";

/** 리뷰 — 쓸 수 있는 주문상품에 작성, 내 리뷰 수정·삭제 */
export const Route = createFileRoute("/account/reviews")({
  beforeLoad: requireMember,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(writableReviewsQuery()),
      context.queryClient.ensureQueryData(myReviewsQuery()),
    ]),
  component: Reviews,
});

function Reviews() {
  const writable = useWritableReviews();
  const mine = useMyReviews();
  return (
    <AccountLayout title={m.account_menu_reviews()}>
      <section className="flex flex-col gap-3">
        <SectionTitle>{m.reviews_writable()}</SectionTitle>
        {writable.length === 0 ? (
          <p className="text-meta text-muted">{m.reviews_writable_empty()}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {writable.map((item) => (
              <li
                key={item.orderItemId}
                className="flex flex-col gap-3 rounded-card border border-line p-4"
              >
                <div className="flex gap-3">
                  <ProductImage
                    src={item.thumbnailUrl}
                    alt={item.productName}
                    className="w-16 shrink-0 self-start"
                  />
                  <div className="flex min-w-0 flex-col">
                    <p className="break-words text-body">{item.productName}</p>
                    {item.optionName ? (
                      <p className="text-caption text-muted">{item.optionName}</p>
                    ) : null}
                    <p className="text-caption text-muted">
                      {m.reviews_until({ date: formatDate(item.writableUntil) })}
                    </p>
                  </div>
                </div>
                <ReviewEditor
                  submitLabel={m.reviews_submit()}
                  onSubmit={(rating, content) =>
                    createReview({ data: { orderItemId: item.orderItemId, rating, content } })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="flex flex-col gap-3">
        <SectionTitle>{m.reviews_mine()}</SectionTitle>
        {mine.contents.length === 0 ? (
          <EmptyState message={m.reviews_mine_empty()} />
        ) : (
          <ul className="flex flex-col gap-3">
            {mine.contents.map((review) => (
              <MyReview key={review.reviewId} review={review} />
            ))}
          </ul>
        )}
      </section>
    </AccountLayout>
  );
}

function MyReview({ review }: { review: ReturnType<typeof useMyReviews>["contents"][number] }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  return (
    <li className="flex flex-col gap-2 rounded-card border border-line p-4">
      <div className="flex gap-3">
        <ProductImage
          src={review.thumbnailUrl}
          alt={review.productName ?? ""}
          className="w-16 shrink-0 self-start"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="break-words text-body">{review.productName}</p>
          <p className="flex items-center gap-2 text-caption text-muted">
            <Stars rating={review.rating} />
            {formatDate(review.createdAt)}
          </p>
        </div>
      </div>
      {editing ? (
        <ReviewEditor
          initialRating={review.rating}
          initialContent={review.content}
          submitLabel={m.account_save()}
          onSubmit={async (rating, content) => {
            const result = await updateReview({
              data: { reviewId: review.reviewId, rating, content },
            });
            if (result.ok) setEditing(false);
            return result;
          }}
        />
      ) : (
        <p className="whitespace-pre-line break-words text-body">{review.content}</p>
      )}
      {review.sellerReply ? (
        <div className="border-point border-l-2 pl-3 text-meta text-sub">
          <p className="font-semibold text-point">{m.reviews_seller_reply()}</p>
          <p className="whitespace-pre-line break-words">{review.sellerReply.content}</p>
        </div>
      ) : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
      <div className="flex gap-2">
        {review.editable && !editing ? (
          <Button size="sm" variant="text" onClick={() => setEditing(true)}>
            {m.account_edit()}
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="text"
          onClick={async () => {
            const result = await removeReview({ data: { reviewId: review.reviewId } });
            if (!result.ok) return setError(result.message);
            await queryClient.invalidateQueries({ queryKey: ["me", "reviews"] });
          }}
        >
          {m.account_delete()}
        </Button>
      </div>
    </li>
  );
}

function ReviewEditor({
  initialRating = 5,
  initialContent = "",
  submitLabel,
  onSubmit,
}: {
  initialRating?: number;
  initialContent?: string;
  submitLabel: string;
  onSubmit: (rating: number, content: string) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [rating, setRating] = useState(initialRating);
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const queryClient = useQueryClient();
  const submit = async () => {
    if (content.trim().length < 10) return setError(m.reviews_too_short());
    setPending(true);
    const result = await onSubmit(rating, content.trim());
    setPending(false);
    if (!result.ok) return setError(result.message ?? null);
    setError(null);
    await queryClient.invalidateQueries({ queryKey: ["me", "reviews"] });
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1" role="radiogroup" aria-label={m.reviews_rating()}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Chip
            key={n}
            selected={rating === n}
            onClick={() => setRating(n)}
            className="min-w-11 px-0"
            aria-label={m.reviews_stars({ count: n })}
          >
            {n}
          </Chip>
        ))}
      </div>
      <Textarea
        value={content}
        maxLength={2000}
        placeholder={m.reviews_placeholder()}
        onChange={(e) => setContent(e.target.value)}
      />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button size="sm" disabled={pending} onClick={submit}>
        {submitLabel}
      </Button>
    </div>
  );
}
