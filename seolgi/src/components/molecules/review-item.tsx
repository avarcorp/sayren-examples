import type { PublicReview } from "@sayren/storefront-sdk";
import { formatDate } from "../../lib/dates";
import { RatingStars } from "../atoms/rating-stars";

/** 리뷰 한 개 — 별점·작성자·날짜, 옵션, 본문, 상점 답글, 오른쪽 사진 */
export function ReviewItem({ review, storeName }: { review: PublicReview; storeName: string }) {
  return (
    <article className="flex flex-wrap gap-6 border-line border-b py-6">
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
        <p className="flex items-center gap-2.5 text-caption text-muted">
          <RatingStars rating={review.rating} />
          <span>{review.writerMaskedName}</span>
          <span>{formatDate(review.createdAt)}</span>
        </p>
        {review.optionName ? <p className="text-caption text-muted">{review.optionName}</p> : null}
        <p className="whitespace-pre-line text-body leading-[1.8]">{review.content}</p>
        {review.sellerReply ? (
          <div className="mt-2 flex flex-col gap-1 border-ink border-l pl-3.5">
            <p className="font-medium text-caption">
              {storeName} 답글{" "}
              <span className="font-normal text-muted">
                {formatDate(review.sellerReply.repliedAt)}
              </span>
            </p>
            <p className="whitespace-pre-line text-prose text-small leading-relaxed">
              {review.sellerReply.content}
            </p>
          </div>
        ) : null}
      </div>
      {review.images[0] ? (
        <img
          src={review.images[0]}
          alt=""
          className="size-24 shrink-0 object-cover"
          loading="lazy"
        />
      ) : null}
    </article>
  );
}
