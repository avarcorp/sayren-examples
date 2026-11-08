import type { ReviewPage } from "@sayren/storefront-sdk";
import { m } from "../../i18n";
import { formatDate } from "../../lib/format";
import { Stars } from "../ui";

/** 상품 리뷰 — 요약(서버 값)과 목록. 리뷰가 없으면 빈 상태 */
export function ReviewList({ reviews }: { reviews: ReviewPage }) {
  const summary = reviews.summary;
  if (reviews.contents.length === 0 || !summary) {
    return <p className="py-6 text-center text-meta text-muted">{m.reviews_empty()}</p>;
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="font-bold text-2xl tabular">{summary.averageRating.toFixed(1)}</span>
        <Stars rating={summary.averageRating} size="md" />
        <span className="text-meta text-muted">
          {m.reviews_count({ count: summary.totalCount })}
        </span>
      </div>
      <ul className="flex flex-col">
        {reviews.contents.map((review) => (
          <li key={review.reviewId} className="flex flex-col gap-1.5 border-line border-t py-4">
            <div className="flex flex-wrap items-center gap-x-2 text-caption text-muted">
              <Stars rating={review.rating} />
              <span>{review.writerMaskedName}</span>
              <span>{formatDate(review.createdAt)}</span>
            </div>
            {review.optionName ? (
              <p className="text-caption text-muted">{review.optionName}</p>
            ) : null}
            <p className="whitespace-pre-line break-words text-body">{review.content}</p>
            {review.images.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto">
                {review.images.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    loading="lazy"
                    className="size-20 shrink-0 rounded-card border border-line object-cover"
                  />
                ))}
              </div>
            ) : null}
            {review.sellerReply ? (
              <div className="mt-1 border-point border-l-2 pl-3 text-meta text-sub">
                <p className="font-semibold text-point">{m.reviews_seller_reply()}</p>
                <p className="whitespace-pre-line break-words">{review.sellerReply.content}</p>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
