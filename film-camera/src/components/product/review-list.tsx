import type { PublicReview, ReviewSummary } from "@sayren/storefront-sdk";
import { Star } from "lucide-react";
import { m } from "../../i18n";
import { DateText, EmptyState } from "../ui";

export function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={m.rating_label({ rating })}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          aria-hidden="true"
          className={n <= Math.round(rating) ? "fill-ink text-ink" : "text-line-strong"}
        />
      ))}
    </span>
  );
}

/** 리뷰 목록 — 요약(평균·개수)과 리뷰. 판매자 답글은 들여 쓴다 */
export function ReviewList({
  summary,
  reviews,
}: {
  summary?: ReviewSummary | null;
  reviews: PublicReview[];
}) {
  if (reviews.length === 0) return <EmptyState message={m.reviews_empty()} />;
  return (
    <div className="flex flex-col gap-4">
      {summary ? (
        <p className="flex items-center gap-2 text-body">
          <Stars rating={summary.averageRating} />
          <span className="tabular text-sub">
            {m.reviews_summary({
              rating: summary.averageRating.toFixed(1),
              count: summary.totalCount,
            })}
          </span>
        </p>
      ) : null}
      <ul className="divide-y divide-line border-line border-y">
        {reviews.map((review) => (
          <li key={review.reviewId} className="flex flex-col gap-2 py-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-meta text-sub">
              <Stars rating={review.rating} />
              <span>{review.writerMaskedName}</span>
              <DateText iso={review.createdAt} />
            </div>
            <p className="whitespace-pre-line break-words text-body-lg">{review.content}</p>
            {review.images.length > 0 ? (
              <ul className="flex gap-2 overflow-x-auto">
                {review.images.map((src) => (
                  <li key={src} className="size-20 shrink-0 overflow-hidden border border-line">
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </li>
                ))}
              </ul>
            ) : null}
            {review.sellerReply ? (
              <div className="mt-1 border-line border-l-2 pl-3 text-body">
                <p className="font-semibold text-meta">{m.reviews_seller_reply()}</p>
                <p className="whitespace-pre-line break-words text-sub">
                  {review.sellerReply.content}
                </p>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
