import type { PublicReview, ReviewSummary } from "@sayren/storefront-sdk";
import { Star } from "lucide-react";
import { useState } from "react";
import { m } from "../i18n";
import { formatDateTime, formatPrice } from "../lib/format";
import {
  fetchReviews,
  REVIEW_SORT_LABELS,
  REVIEW_SORTS,
  type ReviewQuery,
  type ReviewSort,
  ratingBars,
} from "../lib/reviews";
import { buttonClass, choiceClass } from "./ui/button";
import { EmptyState } from "./ui/section";

export interface ReviewsData {
  contents: PublicReview[];
  totalElements: number;
  totalPages: number;
  summary: ReviewSummary | null;
  /** 포토 리뷰 모음(최신 사진 리뷰) */
  photos: PublicReview[];
}

/** 별점 — 채운 별은 잉크, 빈 별은 선 색(lucide Star) */
function Stars({ rating, size = "size-3.5" }: { rating: number; size?: string }) {
  const filled = Math.round(rating);
  return (
    <span aria-label={m.rv_stars({ rating })} role="img" className="inline-flex gap-px">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          strokeWidth={1.6}
          className={`${size} ${star <= filled ? "fill-ink text-ink" : "fill-line text-line"}`}
        />
      ))}
    </span>
  );
}

/**
 * 리뷰 탭 — 평점 요약(평균·분포 막대), 포토 리뷰 모음, 정렬·필터, 리뷰 카드, 더 보기, 빈 상태.
 * 첫 화면 데이터는 상세 loader가 받고(SSR), 정렬·필터를 바꾸면 서버 함수로 다시 받는다.
 */
export function ProductReviews({
  productId,
  initial,
  variants = [],
  reward = null,
}: {
  productId: string;
  initial: ReviewsData | null;
  /** 후기 적립 안내(`getPointPolicy().reviewReward`, 상점 정책 값). 없거나 꺼졌으면 숨긴다 */
  reward?: { enabled: boolean; textPoint: number; photoPoint: number } | null;
  /** 옵션 필터 — 상세의 조합(`variants[]`). 옵션이 하나뿐이면 필터를 그리지 않는다 */
  variants?: { variantId: string; name: string }[];
}) {
  const [query, setQuery] = useState<Omit<ReviewQuery, "productId" | "page">>({ sort: "helpful" });
  const [list, setList] = useState(() => ({
    contents: initial?.contents ?? [],
    totalElements: initial?.totalElements ?? 0,
    totalPages: initial?.totalPages ?? 0,
    page: 1,
  }));
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!initial) return null;
  const summary = initial.summary;
  const total = summary?.totalCount ?? initial.totalElements;
  const average = summary?.averageRating ?? 0;
  const filtered = Boolean(query.hasImage || query.rating || query.variantId);

  const load = (next: Omit<ReviewQuery, "productId" | "page">, page: number) => {
    setPending(true);
    setFailed(false);
    fetchReviews({ data: { productId, ...next, page } })
      .then((result) =>
        setList((current) => ({
          contents: page === 1 ? result.contents : [...current.contents, ...result.contents],
          totalElements: result.totalElements,
          totalPages: result.totalPages,
          page,
        })),
      )
      .catch(() => setFailed(true))
      .finally(() => setPending(false));
  };
  const change = (next: Partial<Omit<ReviewQuery, "productId" | "page">>) => {
    const merged = { ...query, ...next };
    setQuery(merged);
    load(merged, 1);
  };

  const rewardNote =
    reward?.enabled && (reward.textPoint > 0 || reward.photoPoint > 0) ? (
      <p className="bg-chip px-3.5 py-2.5 text-meta">
        {reward.textPoint > 0
          ? m.product_blocks_review_reward({ amount: formatPrice(reward.textPoint) })
          : null}
        {reward.textPoint > 0 && reward.photoPoint > 0 ? " · " : null}
        {reward.photoPoint > 0
          ? m.product_blocks_review_reward_photo({ amount: formatPrice(reward.photoPoint) })
          : null}
      </p>
    ) : null;

  if (total === 0) {
    return (
      <div className="flex flex-col gap-3">
        {rewardNote}
        <div className="border border-line">
          <EmptyState
            icon={<Star aria-hidden="true" className="size-10" strokeWidth={1.2} />}
            title={m.rv_empty()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {rewardNote}
      <div className="grid min-w-0 grid-cols-1 gap-5 bg-chip p-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center sm:p-6">
        <div className="flex items-center gap-3 sm:flex-col sm:gap-1 sm:text-center">
          <p className="sr-only">{m.rv_average_label()}</p>
          <p className="tabular font-bold text-[1.75rem] leading-none sm:text-4xl">
            {average.toFixed(1)}
          </p>
          <div className="flex flex-col gap-1 sm:items-center">
            <Stars rating={average} size="size-4" />
            <p className="text-caption text-sub">{m.rv_total({ count: total })}</p>
          </div>
        </div>
        <ul className="flex min-w-0 flex-col gap-1.5">
          {ratingBars(summary?.distribution, total).map((bar) => (
            <li
              key={bar.star}
              className="flex items-center gap-2 text-caption"
              aria-label={m.rv_distribution_label({ star: bar.star, count: bar.count })}
            >
              <span className="w-6 text-muted" aria-hidden="true">
                {bar.star}점
              </span>
              <span className="h-1.5 min-w-0 flex-1 bg-line" aria-hidden="true">
                <span className="block h-full bg-ink" style={{ width: `${bar.percent}%` }} />
              </span>
              <span className="w-8 text-right text-muted" aria-hidden="true">
                {bar.count}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {initial.photos.length ? (
        <section className="flex min-w-0 flex-col gap-2.5">
          <h3 className="font-bold text-body">{m.rv_photo_title()}</h3>
          <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:gap-2 md:px-0">
            {initial.photos.flatMap((review) =>
              review.images.slice(0, 1).map((src) => (
                <li key={`${review.reviewId}-${src}`} className="shrink-0">
                  <img
                    src={src}
                    alt={m.rv_photo_alt({ writer: review.writerMaskedName, index: 1 })}
                    loading="lazy"
                    className="size-[5.5rem] bg-chip object-cover md:size-28"
                  />
                </li>
              )),
            )}
          </ul>
        </section>
      ) : null}

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-ink border-b-2 pb-3 text-meta">
        <fieldset className="flex flex-wrap gap-x-3 gap-y-1">
          <legend className="sr-only">{m.rv_sort_label()}</legend>
          {REVIEW_SORTS.map((sort: ReviewSort) => (
            <button
              key={sort}
              type="button"
              aria-pressed={query.sort === sort}
              onClick={() => change({ sort })}
              className={query.sort === sort ? "font-bold text-ink" : "text-muted hover:text-ink"}
            >
              {REVIEW_SORT_LABELS[sort]}
            </button>
          ))}
        </fieldset>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              className={choiceClass}
              checked={Boolean(query.hasImage)}
              onChange={(event) => change({ hasImage: event.target.checked })}
            />
            {m.rv_filter_photo()}
          </label>
          {variants.length > 1 ? (
            <select
              aria-label={m.rv_filter_variant()}
              value={query.variantId ?? ""}
              onChange={(event) => change({ variantId: event.target.value || undefined })}
              className="h-8 max-w-40 border border-line-strong bg-page px-2"
            >
              <option value="">{m.rv_filter_variant_all()}</option>
              {variants.map((variant) => (
                <option key={variant.variantId} value={variant.variantId}>
                  {variant.name}
                </option>
              ))}
            </select>
          ) : null}
          <select
            aria-label={m.rv_filter_rating()}
            value={query.rating ?? ""}
            onChange={(event) =>
              change({ rating: event.target.value ? Number(event.target.value) : undefined })
            }
            className="h-8 border border-line-strong bg-page px-2"
          >
            <option value="">{m.rv_filter_rating_all()}</option>
            {[5, 4, 3, 2, 1].map((star) => (
              <option key={star} value={star}>
                {m.rv_filter_rating_value({ star })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {failed ? (
        <p role="alert" className="text-body text-point">
          {m.rv_load_failed()}
        </p>
      ) : null}
      {list.contents.length === 0 ? (
        <p className="py-10 text-center text-body text-muted">
          {filtered ? m.rv_empty_filtered() : m.rv_empty()}
        </p>
      ) : (
        <ul className="divide-y divide-line" aria-busy={pending}>
          {list.contents.map((review) => (
            <ReviewCard key={review.reviewId} review={review} />
          ))}
        </ul>
      )}
      {list.page < list.totalPages ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => load(query, list.page + 1)}
          className={buttonClass({ variant: "subtle", size: "md", block: true })}
        >
          {m.rv_more()}
        </button>
      ) : null}
    </div>
  );
}

function ReviewCard({ review }: { review: PublicReview }) {
  return (
    <li className="flex min-w-0 flex-col gap-2.5 py-5 text-body">
      <div className="flex flex-wrap items-center gap-2">
        <Stars rating={review.rating} />
        <span className="text-caption text-muted">
          {review.writerMaskedName} · {formatDateTime(review.createdAt)}
        </span>
      </div>
      {review.optionName ? (
        <p className="break-words text-caption text-muted">
          {m.rv_option({ name: review.optionName })}
        </p>
      ) : null}
      {review.images.length ? (
        <ul className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {review.images.map((src, index) => (
            <li key={src} className="shrink-0">
              <img
                src={src}
                alt={m.rv_photo_alt({ writer: review.writerMaskedName, index: index + 1 })}
                loading="lazy"
                className="size-20 bg-chip object-cover md:size-24"
              />
            </li>
          ))}
        </ul>
      ) : null}
      <p className="whitespace-pre-line break-words leading-relaxed">{review.content}</p>
      {review.sellerReply ? (
        <div className="flex flex-col gap-1 bg-chip p-3.5">
          <p className="font-bold text-caption">
            {m.rv_seller_reply()}{" "}
            <span className="font-normal text-muted">
              · {formatDateTime(review.sellerReply.repliedAt)}
            </span>
          </p>
          <p className="whitespace-pre-line break-words text-meta">{review.sellerReply.content}</p>
        </div>
      ) : null}
    </li>
  );
}
