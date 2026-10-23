import type { ReviewPage } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { buttonClass } from "../atoms/button";
import { Checkbox } from "../atoms/checkbox";
import { RatingSummary } from "../molecules/rating-summary";
import { ReviewItem } from "../molecules/review-item";

export interface ReviewSortOption<S extends string> {
  value: S;
  label: string;
}

/**
 * 리뷰 구역 (시안 PdpDetail) — 왼쪽 제목·평균·분포·「리뷰 작성」, 오른쪽 사진 줄·정렬·사진 리뷰만·목록·더 보기.
 * 목록 상태(정렬·필터·쪽)는 부르는 쪽이 가진다.
 */
export function Reviews<S extends string>({
  summary,
  photos,
  reviews,
  hasMore,
  loading,
  sort,
  sorts,
  photoOnly,
  storeName,
  onSort,
  onPhotoOnly,
  onMore,
}: {
  summary: ReviewPage["summary"] | null;
  photos: ReviewPage["contents"];
  reviews: ReviewPage["contents"];
  hasMore: boolean;
  loading: boolean;
  sort: S;
  sorts: readonly ReviewSortOption<S>[];
  photoOnly: boolean;
  storeName: string;
  onSort: (sort: S) => void;
  onPhotoOnly: (on: boolean) => void;
  onMore: () => void;
}) {
  const total = summary?.totalCount ?? 0;
  return (
    <div className="flex flex-wrap items-start gap-12 md:gap-16">
      <div className="flex flex-[1_1_280px] flex-col gap-6">
        <h2 id="reviews-title" className="font-medium text-title">
          리뷰 {total > 0 ? total : ""}
        </h2>
        {summary && total > 0 ? <RatingSummary summary={summary} /> : null}
        <Link to="/account/reviews" className={buttonClass({ variant: "outline", size: "sm" })}>
          리뷰 작성
        </Link>
      </div>
      <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-6">
        {total === 0 ? (
          <p className="border-ink border-t py-12 text-center text-muted">
            아직 리뷰가 없습니다. 구매확정 후 첫 리뷰를 남길 수 있습니다.
          </p>
        ) : (
          <>
            {photos.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto">
                {photos.flatMap((r) =>
                  r.images
                    .slice(0, 1)
                    .map((src) => (
                      <img
                        key={src + r.reviewId}
                        src={src}
                        alt=""
                        className="size-[120px] shrink-0 object-cover"
                        loading="lazy"
                      />
                    )),
                )}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3 text-small">
              <div className="flex flex-wrap gap-5">
                {sorts.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    aria-pressed={s.value === sort}
                    onClick={() => onSort(s.value)}
                    className={`h-11 ${s.value === sort ? "font-medium" : "text-muted hover:text-ink"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <Checkbox
                checked={photoOnly}
                onChange={(e) => onPhotoOnly(e.target.checked)}
                className="text-muted"
              >
                사진 리뷰만
              </Checkbox>
            </div>
            <div className="flex flex-col border-ink border-t">
              {reviews.length === 0 ? (
                <p className="py-12 text-center text-muted">조건에 맞는 리뷰가 없습니다.</p>
              ) : (
                reviews.map((r) => <ReviewItem key={r.reviewId} review={r} storeName={storeName} />)
              )}
            </div>
            {hasMore ? (
              <button
                type="button"
                disabled={loading}
                onClick={onMore}
                className="h-12 self-center px-8 text-body underline underline-offset-4 disabled:opacity-40"
              >
                리뷰 더 보기
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
