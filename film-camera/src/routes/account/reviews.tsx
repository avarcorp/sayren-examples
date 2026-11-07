import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { AccountLayout } from "../../components/account/account-layout";
import { LineItem } from "../../components/line-item";
import { Stars } from "../../components/product/review-list";
import {
  Button,
  DateText,
  EmptyState,
  ErrorState,
  SectionTitle,
  TextArea,
} from "../../components/ui";
import { useAction } from "../../hooks/use-action";
import { m } from "../../i18n";
import { createReview, removeReview } from "../../lib/account-actions";
import { myReviewsQuery, writableReviewsQuery } from "../../lib/account-queries";
import { requireMember } from "../../lib/guards";

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
  const writable = useSuspenseQuery(writableReviewsQuery()).data;
  const mine = useSuspenseQuery(myReviewsQuery()).data;
  const [writing, setWriting] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["me", "reviews"] });
  const remove = async (reviewId: string) => {
    const result = await run(() => removeReview({ data: { reviewId } }));
    if (result.ok) await refresh();
  };
  return (
    <AccountLayout title={m.reviews_my_title()}>
      <section aria-labelledby="rv-writable" className="flex flex-col gap-2">
        <SectionTitle id="rv-writable">{m.reviews_writable()}</SectionTitle>
        {writable.length === 0 ? (
          <EmptyState message={m.reviews_writable_empty()} />
        ) : (
          <ul className="divide-y divide-line border-line border-y">
            {writable.map((item) => (
              <li key={item.orderItemId} className="flex flex-col">
                <div className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="break-words text-body">{item.productName}</p>
                    <p className="text-meta text-sub">
                      <DateText iso={item.writableUntil} /> {m.reviews_writable_until({ date: "" })}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setWriting(writing === item.orderItemId ? null : item.orderItemId)
                    }
                  >
                    {m.reviews_write()}
                  </Button>
                </div>
                {writing === item.orderItemId ? (
                  <ReviewForm
                    orderItemId={item.orderItemId}
                    onDone={async () => {
                      setWriting(null);
                      await refresh();
                    }}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      {error ? <ErrorState message={error} /> : null}
      <section aria-labelledby="rv-mine" className="flex flex-col gap-2">
        <SectionTitle id="rv-mine">{m.reviews_mine()}</SectionTitle>
        {mine.contents.length === 0 ? (
          <EmptyState message={m.reviews_mine_empty()} />
        ) : (
          <ul className="divide-y divide-line border-line border-y">
            {mine.contents.map((review) => (
              <li key={review.reviewId}>
                <LineItem
                  name={review.productName ?? ""}
                  thumbnailUrl={review.thumbnailUrl}
                  quantity={1}
                  totalPrice={0}
                  currency="KRW"
                  hidePrice
                >
                  <div className="flex flex-wrap items-center gap-2 text-meta text-sub">
                    <Stars rating={review.rating} />
                    <DateText iso={review.createdAt} />
                  </div>
                  <p className="whitespace-pre-line break-words text-body">
                    {review.blinded ? m.reviews_blinded() : review.content}
                  </p>
                  {review.editable ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="min-h-11 px-1 text-meta text-sub underline"
                        disabled={pending}
                        onClick={() => remove(review.reviewId)}
                      >
                        {m.reviews_delete()}
                      </button>
                    </div>
                  ) : null}
                </LineItem>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AccountLayout>
  );
}

function ReviewForm({ orderItemId, onDone }: { orderItemId: string; onDone: () => Promise<void> }) {
  const [rating, setRating] = useState(5);
  const { pending, error, run } = useAction();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = String(new FormData(event.currentTarget).get("content") ?? "");
    const result = await run(() => createReview({ data: { orderItemId, rating, content } }));
    if (result.ok) await onDone();
  };

  return (
    <form className="flex flex-col gap-4 pb-4" onSubmit={submit}>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="pb-1.5 font-semibold text-meta">{m.reviews_rating()}</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="peer sr-only"
              />
              <span
                className={`inline-flex size-11 items-center justify-center border text-body peer-focus-visible:outline-2 peer-focus-visible:outline-point ${n <= rating ? "border-ink font-bold" : "border-line text-muted"}`}
              >
                {n}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <TextArea
        id={`review-content-${orderItemId}`}
        name="content"
        label={m.reviews_content()}
        required
        minLength={10}
        maxLength={2000}
        help={m.reviews_content_help()}
        error={error ?? undefined}
      />
      <Button type="submit" className="self-start" disabled={pending}>
        {m.reviews_submit()}
      </Button>
    </form>
  );
}
