import { createReviewRequestSchema, updateReviewRequestSchema } from "@sayren/storefront-sdk";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFor } from "./api.server";
import { requireToken } from "./require-token.server";
import {
  type ReviewFailure,
  reviewFailureOf,
  type UploadFailure,
  uploadFailureOf,
} from "./review-failure";

export type { ReviewFailure, UploadFailure };

/**
 * 마이페이지 리뷰 — 작성 가능한 주문 상품(`reviews.listWritable`), 내가 쓴 리뷰(`reviews.listMine`), 작성·수정·삭제,
 * 리뷰 사진 업로드 자리 발급(`reviews.createImageUpload`). 구매자 토큰은 서버에만 둔다.
 * 사진 바이트는 브라우저가 발급받은 `uploadUrl`(서명된 주소)에 바로 PUT한다 — 토큰이 필요 없다.
 */

export const MY_REVIEWS_PAGE_SIZE = 10;

export const getMyReviews = createServerFn({ method: "GET" })
  .validator(z.object({ page: z.number().int().min(1) }))
  .handler(async ({ data }) => {
    const accessToken = requireToken("/account/reviews");
    const api = apiFor({ accessToken });
    const [writable, mine] = await Promise.all([
      api.reviews.listWritable(),
      api.reviews.listMine({ page: data.page, size: MY_REVIEWS_PAGE_SIZE }),
    ]);
    return { writable, mine };
  });

export const getWritableItem = createServerFn({ method: "GET" })
  .validator(z.object({ orderItemId: z.string() }))
  .handler(async ({ data }) => {
    const accessToken = requireToken(`/account/reviews/write/${data.orderItemId}`);
    const writable = await apiFor({ accessToken }).reviews.listWritable();
    return writable.find((item) => item.orderItemId === data.orderItemId) ?? null;
  });

/** 수정할 내 리뷰 — 단건 조회 API가 없어 내 리뷰 목록에서 찾는다(최신순, 수정 기한 30일이라 앞 페이지에 있다) */
export const getMyReview = createServerFn({ method: "GET" })
  .validator(z.object({ reviewId: z.string() }))
  .handler(async ({ data }) => {
    const accessToken = requireToken(`/account/reviews/edit/${data.reviewId}`);
    const api = apiFor({ accessToken });
    for (let page = 1; page <= 5; page++) {
      const result = await api.reviews.listMine({ page, size: 50 });
      const found = result.contents.find((review) => review.reviewId === data.reviewId);
      if (found) return found;
      if (page >= result.totalPages) break;
    }
    return null;
  });

type MutationResult = { ok: boolean; failure: ReviewFailure | null; code: string | null };

async function attempt(run: () => Promise<unknown>): Promise<MutationResult> {
  try {
    await run();
    return { ok: true, failure: null, code: null };
  } catch (error) {
    const { reason, code } = reviewFailureOf(error);
    return { ok: false, failure: reason, code };
  }
}

export const createMyReview = createServerFn({ method: "POST" })
  .validator(z.object({ orderItemId: z.string(), body: createReviewRequestSchema }))
  .handler(({ data }) => {
    const accessToken = requireToken(`/account/reviews/write/${data.orderItemId}`);
    return attempt(() => apiFor({ accessToken }).reviews.create(data.orderItemId, data.body));
  });

export const updateMyReview = createServerFn({ method: "POST" })
  .validator(z.object({ reviewId: z.string(), body: updateReviewRequestSchema }))
  .handler(({ data }) => {
    const accessToken = requireToken(`/account/reviews/edit/${data.reviewId}`);
    return attempt(() => apiFor({ accessToken }).reviews.update(data.reviewId, data.body));
  });

export const deleteMyReview = createServerFn({ method: "POST" })
  .validator(z.object({ reviewId: z.string() }))
  .handler(({ data }) => {
    const accessToken = requireToken("/account/reviews");
    return attempt(() => apiFor({ accessToken }).reviews.remove(data.reviewId));
  });

/** 리뷰 사진 업로드 자리 — 실패하면 사유만 준다(형식·크기·연타) */
export const createReviewImageUpload = createServerFn({ method: "POST" })
  .validator(z.object({ filename: z.string().min(1).max(255), size: z.number().int().positive() }))
  .handler(
    async ({ data }): Promise<{ url: string; uploadUrl: string } | { failure: UploadFailure }> => {
      const accessToken = requireToken("/account/reviews");
      try {
        return await apiFor({ accessToken }).reviews.createImageUpload({
          filename: data.filename,
          size: data.size,
          purpose: "review-image",
        });
      } catch (error) {
        return { failure: uploadFailureOf(error) };
      }
    },
  );
