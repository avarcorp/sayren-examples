import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { lazyMessages, m } from "../i18n";
import { apiFor } from "./api.server";

/**
 * 상품 리뷰 조회 — 정렬·포토만·평점·옵션(`variantId`, storefront-sdk 0.18.3) 필터를 함께 쓸 수 있다.
 * `helpful`(랭킹순)은 사진 있는 리뷰 → 평점 높은 순 → 최신 순이다(storefront-sdk 0.18.4, 도움돼요 수는 반영하지 않는다).
 * 첫 화면은 상세 loader가 서버에서 받고, 정렬·필터·더 보기는 이 서버 함수로 받는다.
 */
export const REVIEW_SORTS = ["helpful", "latest", "ratingDesc", "ratingAsc"] as const;
export type ReviewSort = (typeof REVIEW_SORTS)[number];

export const REVIEW_SORT_LABELS = lazyMessages<ReviewSort>({
  helpful: () => m.rv_sort_helpful(),
  latest: () => m.rv_sort_latest(),
  ratingDesc: () => m.rv_sort_rating_desc(),
  ratingAsc: () => m.rv_sort_rating_asc(),
});

export const REVIEW_PAGE_SIZE = 5;

export const reviewQuerySchema = z.object({
  productId: z.string(),
  sort: z.enum(REVIEW_SORTS),
  hasImage: z.boolean().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  variantId: z.string().optional(),
  page: z.number().int().min(1),
});
export type ReviewQuery = z.infer<typeof reviewQuerySchema>;

export const fetchReviews = createServerFn({ method: "GET" })
  .validator(reviewQuerySchema)
  .handler(({ data }) =>
    apiFor().catalog.listProductReviews(data.productId, {
      sort: data.sort,
      hasImage: data.hasImage || undefined,
      rating: data.rating,
      variantId: data.variantId,
      page: data.page,
      size: REVIEW_PAGE_SIZE,
    }),
  );

/** 평점 분포 — 5점부터 1점까지, 비율(0~100)과 건수. 총건수가 0이면 비율도 0이다 */
export function ratingBars(
  distribution: Record<string, number> | undefined,
  totalCount: number,
): { star: number; count: number; percent: number }[] {
  return [5, 4, 3, 2, 1].map((star) => {
    const count = distribution?.[String(star)] ?? 0;
    return { star, count, percent: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0 };
  });
}
