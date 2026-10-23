import {
  ApiError,
  type ProductDetail,
  type PublicInquiry,
  type ReviewPage,
  type StorefrontCoupon,
} from "@sayren/storefront-sdk";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFor } from "./api.server";
import { messageOf } from "./errors";
import { readToken } from "./session.server";

/** 상품 상세 — 상품번호와 상품 id를 모두 받는다. 없는 상품은 404 화면이다 */
export const getProductFn = createServerFn({ method: "GET" })
  .validator(z.object({ ref: z.string().min(1).max(64) }))
  .handler(async ({ data }): Promise<ProductDetail> => {
    try {
      return await apiFor().catalog.getProduct(data.ref);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) throw notFound();
      throw error;
    }
  });

export interface ProductBlocks {
  reviews: ReviewPage | null;
  photoReviews: ReviewPage["contents"];
  inquiries: { contents: PublicInquiry[]; totalElements: number } | null;
  /** 이 상품에 쓰는 받을 수 있는 쿠폰 */
  coupons: StorefrontCoupon[];
  /** 찜했는가(로그인했을 때만 안다) */
  wished: boolean;
  loggedIn: boolean;
}

/**
 * 상세 아래 블록 — 리뷰 첫 쪽(요약 포함)·사진 리뷰·문의. 하나가 실패하면 그 블록만 숨긴다.
 * 로그인했으면 문의 목록에 본인 비밀 문의도 보인다.
 */
export const getProductBlocksFn = createServerFn({ method: "GET" })
  .validator(z.object({ productId: z.string() }))
  .handler(async ({ data }): Promise<ProductBlocks> => {
    const accessToken = readToken();
    const api = apiFor({ accessToken });
    const [reviews, photos, inquiries, coupons, wishlist] = await Promise.all([
      api.catalog
        .listProductReviews(data.productId, { sort: "helpful", page: 1, size: REVIEW_PAGE })
        .catch(() => null),
      api.catalog
        .listProductReviews(data.productId, { hasImage: true, sort: "latest", size: 10 })
        .catch(() => null),
      api.catalog.listProductInquiries(data.productId, { size: 10 }).catch(() => null),
      api.catalog.listCoupons({ productId: data.productId }).catch(() => null),
      // 찜 여부 — 찜 목록 첫 100개에서 찾는다(상품마다 묻는 API가 없다)
      accessToken ? api.member.listWishlist({ size: 100 }).catch(() => null) : null,
    ]);
    return {
      reviews,
      photoReviews: photos?.contents ?? [],
      inquiries: inquiries && {
        contents: inquiries.contents,
        totalElements: inquiries.totalElements,
      },
      coupons: coupons?.contents ?? [],
      wished: Boolean(
        wishlist?.contents.some((p: { productId: string }) => p.productId === data.productId),
      ),
      loggedIn: Boolean(accessToken),
    };
  });

export const REVIEW_PAGE = 10;
export const REVIEW_SORTS = [
  { value: "helpful", label: "랭킹순" },
  { value: "latest", label: "최신순" },
  { value: "ratingDesc", label: "평점 높은순" },
  { value: "ratingAsc", label: "평점 낮은순" },
] as const;
export type ReviewSort = (typeof REVIEW_SORTS)[number]["value"];

/** 리뷰 한 쪽 — 정렬·사진 리뷰만·더 보기 */
export const getReviewsFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      productId: z.string(),
      sort: z.enum(["helpful", "latest", "ratingDesc", "ratingAsc"]),
      hasImage: z.boolean(),
      page: z.number().int().min(1),
    }),
  )
  .handler(
    ({ data }): Promise<ReviewPage> =>
      apiFor().catalog.listProductReviews(data.productId, {
        sort: data.sort,
        hasImage: data.hasImage || undefined,
        page: data.page,
        size: REVIEW_PAGE,
      }),
  );

/** 상품 문의 남기기 — 로그인한 구매자만 */
export const createInquiryFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      productId: z.string(),
      content: z.string().trim().min(1).max(1000),
      secret: z.boolean(),
    }),
  )
  .handler(async ({ data }): Promise<{ ok: true } | { needLogin: true } | { error: string }> => {
    const accessToken = readToken();
    if (!accessToken) return { needLogin: true };
    try {
      await apiFor({ accessToken }).catalog.createInquiry(data.productId, {
        content: data.content,
        secret: data.secret,
      });
      return { ok: true };
    } catch (error) {
      return { error: messageOf(error, "문의를 남기지 못했습니다.") };
    }
  });
