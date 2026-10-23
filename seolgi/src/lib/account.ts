import {
  ApiError,
  type ClaimPreview,
  type CustomerInquiry,
  claimReasonSchema,
  claimTypeSchema,
  createCustomerInquiryRequestSchema,
  createReviewRequestSchema,
  type DeliveryTracking,
  type Member,
  type MemberAddress,
  type MemberPointEntry,
  type MemberPoints,
  type MyClaim,
  type MyCoupon,
  type MyOrder,
  type MyReview,
  memberAddressRequestSchema,
  type PageInfo,
  type ProductCard,
  type PublicInquiry,
  type StorefrontCoupon,
  updateReviewRequestSchema,
  type WritableReview,
} from "@sayren/storefront-sdk";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { act, memberApi } from "./account-api.server";
import { authFor } from "./api.server";
import { clearDirectLine } from "./direct-checkout.server";
import { messageOf } from "./errors";
import { readToken, signOut } from "./session.server";

/**
 * 마이페이지 서버 함수 — 모두 구매자 토큰이 있어야 한다. 토큰이 없으면 로그인으로 보낸다(돌아올 곳은 부르는 쪽이 정한다).
 * 쓰기 결과는 `{ error }`로 돌려 화면이 서버 문구를 보인다.
 */
type Page<T> = PageInfo & { contents: T[] };
const pageInput = z.object({ page: z.number().int().min(1).optional() });

export interface AccountSummary {
  member: Member;
  points: MemberPoints | null;
  couponCount: number;
}

/** 마이페이지 왼쪽 위 — 이름, 적립금, 쓸 수 있는 쿠폰 수 */
export const getAccountSummaryFn = createServerFn({ method: "GET" })
  .validator(z.object({ redirectTo: z.string().max(500) }))
  .handler(async ({ data }): Promise<AccountSummary> => {
    const api = memberApi(data.redirectTo);
    const member = await api.member.me().catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 401)
        throw redirect({ to: "/login", search: { redirectTo: data.redirectTo } });
      throw error;
    });
    const [points, coupons] = await Promise.all([
      api.member.getPoints().catch(() => null),
      api.me.coupons({ status: "available" }).catch(() => []),
    ]);
    return { member, points, couponCount: coupons.length };
  });

export const getMyOrdersFn = createServerFn({ method: "GET" })
  .validator(pageInput)
  .handler(
    ({ data }): Promise<Page<MyOrder>> => memberApi().myOrders.list({ page: data.page, size: 10 }),
  );

export const getDeliveryFn = createServerFn({ method: "GET" })
  .validator(z.object({ orderItemId: z.string() }))
  .handler(
    async ({ data }): Promise<DeliveryTracking | null> =>
      memberApi()
        .myOrders.getDelivery(data.orderItemId)
        .catch(() => null),
  );

export const decidePurchaseFn = createServerFn({ method: "POST" })
  .validator(z.object({ orderItemId: z.string() }))
  .handler(({ data }) =>
    act(() => memberApi().myOrders.decidePurchase(data.orderItemId), "구매확정하지 못했습니다."),
  );

const claimInput = z.object({
  orderItemId: z.string(),
  type: claimTypeSchema,
  reason: claimReasonSchema,
  reasonDetail: z.string().max(1000).optional(),
});

export const previewClaimFn = createServerFn({ method: "POST" })
  .validator(claimInput)
  .handler(async ({ data }): Promise<ClaimPreview | null> => {
    const { orderItemId, ...body } = data;
    return memberApi()
      .myClaims.preview(orderItemId, body)
      .catch(() => null);
  });

export const createClaimFn = createServerFn({ method: "POST" })
  .validator(claimInput)
  .handler(({ data }) => {
    const { orderItemId, ...body } = data;
    return act(() => memberApi().myClaims.create(orderItemId, body), "신청하지 못했습니다.");
  });

export const getMyClaimsFn = createServerFn({ method: "GET" })
  .validator(pageInput)
  .handler(
    ({ data }): Promise<Page<MyClaim>> => memberApi().myClaims.list({ page: data.page, size: 10 }),
  );

export const withdrawClaimFn = createServerFn({ method: "POST" })
  .validator(z.object({ claimId: z.string() }))
  .handler(({ data }) =>
    act(() => memberApi().myClaims.withdraw(data.claimId), "철회하지 못했습니다."),
  );

export const getWishlistFn = createServerFn({ method: "GET" })
  .validator(pageInput)
  .handler(
    ({ data }): Promise<Page<ProductCard>> =>
      memberApi().member.listWishlist({ page: data.page, size: 20 }),
  );

export const getCouponsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ mine: MyCoupon[]; downloadable: StorefrontCoupon[] }> => {
    const api = memberApi();
    const [mine, store] = await Promise.all([
      api.me.coupons().catch(() => []),
      api.catalog.listCoupons({ size: 50 }).catch(() => null),
    ]);
    return { mine, downloadable: (store?.contents ?? []).filter((c) => c.downloaded !== true) };
  },
);

export const getPointsFn = createServerFn({ method: "GET" })
  .validator(pageInput)
  .handler(
    async ({ data }): Promise<{ points: MemberPoints | null; history: Page<MemberPointEntry> }> => {
      const api = memberApi();
      const [points, history] = await Promise.all([
        api.member.getPoints().catch(() => null),
        api.member.listPointHistory({ page: data.page, size: 20 }),
      ]);
      return { points, history };
    },
  );

export const getReviewsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ writable: WritableReview[]; mine: Page<MyReview> }> => {
    const api = memberApi();
    const [writable, mine] = await Promise.all([
      api.reviews.listWritable().catch(() => []),
      api.reviews.listMine({ size: 50 }),
    ]);
    return { writable, mine };
  },
);

export const createReviewFn = createServerFn({ method: "POST" })
  .validator(createReviewRequestSchema.extend({ orderItemId: z.string() }))
  .handler(async ({ data }): Promise<{ error: string | null; rewardPoint: number }> => {
    const { orderItemId, ...body } = data;
    try {
      const r = await memberApi().reviews.create(orderItemId, body);
      return { error: null, rewardPoint: r.rewardPoint };
    } catch (error) {
      return { error: messageOf(error, "리뷰를 남기지 못했습니다."), rewardPoint: 0 };
    }
  });

export const updateReviewFn = createServerFn({ method: "POST" })
  .validator(z.object({ reviewId: z.string(), body: updateReviewRequestSchema }))
  .handler(({ data }) =>
    act(() => memberApi().reviews.update(data.reviewId, data.body), "리뷰를 고치지 못했습니다."),
  );

export const deleteReviewFn = createServerFn({ method: "POST" })
  .validator(z.object({ reviewId: z.string() }))
  .handler(({ data }) =>
    act(() => memberApi().reviews.remove(data.reviewId), "리뷰를 지우지 못했습니다."),
  );

/** 리뷰 사진 업로드 자리 — 브라우저가 받은 주소로 바로 올린다 */
export const reviewImageUploadFn = createServerFn({ method: "POST" })
  .validator(z.object({ filename: z.string().min(1).max(255), size: z.number().int().positive() }))
  .handler(
    async ({ data }): Promise<{ url: string; uploadUrl: string } | null> =>
      memberApi()
        .reviews.createImageUpload({ filename: data.filename, size: data.size })
        .catch(() => null),
  );

export const getMyInquiriesFn = createServerFn({ method: "GET" })
  .validator(pageInput)
  .handler(
    ({ data }): Promise<Page<PublicInquiry>> =>
      memberApi().inquiries.listMine({ page: data.page, size: 20 }),
  );

export const getSupportFn = createServerFn({ method: "GET" })
  .validator(pageInput)
  .handler(
    ({ data }): Promise<Page<CustomerInquiry>> =>
      memberApi().me.customerInquiries.list({ page: data.page, size: 20 }),
  );

export const createSupportFn = createServerFn({ method: "POST" })
  .validator(createCustomerInquiryRequestSchema)
  .handler(({ data }) =>
    act(() => memberApi().me.customerInquiries.create(data), "문의를 남기지 못했습니다."),
  );

export const getAddressesFn = createServerFn({ method: "GET" }).handler(
  (): Promise<MemberAddress[]> => memberApi().member.listAddresses(),
);

export const saveAddressFn = createServerFn({ method: "POST" })
  .validator(z.object({ addressId: z.string().optional(), body: memberAddressRequestSchema }))
  .handler(({ data }) =>
    act(
      () =>
        data.addressId
          ? memberApi().member.updateAddress(data.addressId, data.body)
          : memberApi().member.createAddress(data.body),
      "배송지를 저장하지 못했습니다.",
    ),
  );

export const deleteAddressFn = createServerFn({ method: "POST" })
  .validator(z.object({ addressId: z.string() }))
  .handler(({ data }) =>
    act(() => memberApi().member.deleteAddress(data.addressId), "배송지를 지우지 못했습니다."),
  );

export const updateProfileFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().trim().min(1).max(50),
      phone: z.string().regex(/^(01[0-9]{8,9})?$/),
      marketingAgreed: z.boolean(),
    }),
  )
  .handler(({ data }) =>
    act(
      () =>
        memberApi().member.updateMe({
          name: data.name,
          // 비운 칸도 보낸다 — 빼면 지운 번호가 남는다
          phone: data.phone,
          marketingAgreed: data.marketingAgreed,
        }),
      "회원 정보를 저장하지 못했습니다.",
    ),
  );

/** 다시 동의 — 필수(이용약관·개인정보)는 true로만 보내고, 마케팅은 고른 값 */
export const updateConsentsFn = createServerFn({ method: "POST" })
  .validator(z.object({ marketing: z.boolean() }))
  .handler(({ data }) =>
    act(
      () =>
        memberApi("/").member.updateConsents({
          terms: true,
          privacy: true,
          marketing: data.marketing,
        }),
      "동의를 저장하지 못했습니다.",
    ),
  );

/**
 * 회원 탈퇴 — 끝나지 않은 주문·클레임·결제가 있으면 막힌다. 이메일 가입 회원은 비밀번호로 다시 확인하고,
 * 소셜 가입 회원은 최근 10분 안에 로그인했어야 한다. 탈퇴하면 세션·바로구매 쿠키를 지운다.
 */
export const withdrawFn = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().max(200).optional() }))
  .handler(async ({ data }): Promise<{ error: string | null }> => {
    const accessToken = readToken();
    if (!accessToken) return { error: "다시 로그인하십시오." };
    try {
      await authFor().withdraw(accessToken, data.password ? { password: data.password } : {});
      signOut();
      clearDirectLine();
      return { error: null };
    } catch (error) {
      if (!(error instanceof ApiError)) return { error: "탈퇴하지 못했습니다. 다시 시도하십시오." };
      switch (error.code) {
        case "WITHDRAWAL_BLOCKED": {
          const d = error.details as
            | { inProgressOrderItems?: number; openClaims?: number; pendingPayments?: number }
            | undefined;
          const parts = [
            d?.inProgressOrderItems ? `진행 중인 주문 ${d.inProgressOrderItems}건` : null,
            d?.openClaims ? `처리 중인 취소·반품 ${d.openClaims}건` : null,
            d?.pendingPayments ? `결제 대기 ${d.pendingPayments}건` : null,
          ].filter(Boolean);
          return {
            error: `${parts.length ? parts.join(", ") : "끝나지 않은 주문"}이 있어 탈퇴할 수 없습니다. 모두 끝난 뒤 다시 시도하십시오.`,
          };
        }
        case "PASSWORD_REQUIRED":
          return { error: "비밀번호를 입력하십시오." };
        case "PASSWORD_MISMATCH":
          return { error: "비밀번호가 맞지 않습니다." };
        case "REAUTH_REQUIRED":
          return { error: "보안을 위해 다시 로그인한 뒤 10분 안에 탈퇴하십시오." };
        case "ACCOUNT_LOCKED":
          return { error: "확인을 여러 번 실패해 잠시 막았습니다. 잠시 뒤 다시 시도하십시오." };
        default:
          return { error: messageOf(error, "탈퇴하지 못했습니다.") };
      }
    }
  });
