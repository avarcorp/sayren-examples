import {
  ApiError,
  type ApplicableCoupon,
  type CheckoutPricing,
  type CheckoutSession,
  cashReceiptRequestSchema,
  type Member,
  type MemberAddress,
  memberAddressRequestSchema,
  paymentOptionSchema,
} from "@sayren/storefront-sdk";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";
import { apiFor } from "./api.server";
import { checkoutApi } from "./checkout-api.server";
import { checkoutIntentFrom, checkoutSearch } from "./checkout-intent";
import type { PublicConfig } from "./config";
import { publicConfig } from "./config.server";
import { readDirectLine } from "./direct-checkout.server";
import { PAYMENT_RETURN_PATH } from "./payments";
import { readToken } from "./session.server";

export interface CheckoutData {
  checkout: CheckoutSession;
  member: Member | null;
  coupons: ApplicableCoupon[];
  addresses: MemberAddress[];
  config: PublicConfig;
}

/**
 * 주문서 만들기 — 진입할 때마다 새로 만든다(조회 API가 없고 가격·재고를 매번 다시 계산한다).
 * 바로구매의 추가 선택·직접 입력은 주소가 아니라 HttpOnly 쿠키에서 읽는다.
 */
export const createCheckoutFn = createServerFn({ method: "POST" })
  .validator(z.object({ search: checkoutSearch, back: z.string().max(2000) }))
  .handler(async ({ data }): Promise<CheckoutData> => {
    const intent = checkoutIntentFrom(data.search, data.search.direct ? readDirectLine() : null);
    if (!intent) {
      // 바로구매 쿠키가 없거나(만료·주문 완료) 다른 상품의 것이면 상품 화면에서 다시 고른다
      if (data.search.direct && data.search.productId) {
        throw redirect({
          to: "/products/$productNo",
          params: { productNo: data.search.productId },
        });
      }
      throw redirect({ to: "/cart" });
    }
    const accessToken = readToken();
    const api = checkoutApi();
    const [checkout, member] = await Promise.all([
      api.checkout.create(intent).catch((error: unknown) => {
        // 회원만 주문받는 상점 — 로그인 뒤 돌아온다(장바구니 주문은 로그인하며 줄 id가 바뀔 수 있어 장바구니로)
        if (error instanceof ApiError && error.code === "GUEST_CHECKOUT_DISABLED") {
          throw redirect({
            to: "/login",
            search: { redirectTo: intent.cartItemIds ? "/cart" : data.back },
          });
        }
        throw error;
      }),
      accessToken ? api.member.me().catch(() => null) : null,
    ]);
    const [coupons, addresses] = member
      ? await Promise.all([
          api.checkout.applicableCoupons(checkout.checkoutId).catch(() => []),
          api.member.listAddresses().catch(() => []),
        ])
      : [[], []];
    return { checkout, member, coupons, addresses, config: publicConfig() };
  });

/** 배송비 미리보기 — 우편번호로 제주·도서산간 추가 배송비를 다시 계산한다(주문서를 바꾸지 않는다) */
export const quoteDeliveryFn = createServerFn({ method: "POST" })
  .validator(z.object({ checkoutId: z.string(), zipCode: z.string().regex(/^[0-9]{5}$/) }))
  .handler(async ({ data }) => {
    try {
      return await checkoutApi().checkout.quoteDelivery(data.checkoutId, { zipCode: data.zipCode });
    } catch {
      return null;
    }
  });

const couponRef = z
  .union([
    z.object({ issueId: z.string().min(1) }),
    z.object({ code: z.string().regex(/^[A-Za-z0-9_-]{6,30}$/) }),
  ])
  .nullable();
export type CouponRef = z.infer<typeof couponRef>;

/**
 * 금액 미리보기 — 쿠폰·적립금·우편번호로 서버가 계산한 금액을 받는다. 쿠폰·적립금을 예약하지 않는다.
 * 확정은 결제 시작이 같은 값을 보낼 때다.
 */
export const previewPricingFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      checkoutId: z.string(),
      coupon: couponRef,
      pointAmount: z.number().int().min(0),
      zipCode: z.string(),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{
      pricing: CheckoutPricing | null;
      code: string | null;
      reason: string | null;
    }> => {
      try {
        const pricing = await checkoutApi().checkout.pricing(data.checkoutId, {
          coupons: data.coupon ? [data.coupon] : [],
          pointAmount: data.pointAmount || undefined,
          zipCode: /^[0-9]{5}$/.test(data.zipCode) ? data.zipCode : undefined,
        });
        return { pricing, code: null, reason: null };
      } catch (error) {
        // 무엇이 실패했는지(쿠폰·적립금)는 부르는 쪽이 코드로 가린다
        return {
          pricing: null,
          code: error instanceof ApiError ? error.code : "UNKNOWN",
          reason:
            error instanceof ApiError
              ? ((error.details?.reason as string | undefined) ?? null)
              : null,
        };
      }
    },
  );

/** 새로 입력한 배송지를 기본 배송지로 저장 — 실패해도 결제는 진행한다 */
export const saveAddressFn = createServerFn({ method: "POST" })
  .validator(memberAddressRequestSchema)
  .handler(async ({ data }) => {
    const accessToken = readToken();
    if (!accessToken) return { saved: false };
    try {
      await apiFor({ accessToken }).member.createAddress(data);
      return { saved: true };
    } catch {
      return { saved: false };
    }
  });

const startSchema = z.object({
  checkoutId: z.string(),
  option: paymentOptionSchema.optional(),
  back: z.string().max(2000),
  shippingAddress: z.object({
    receiverName: z.string(),
    phone: z.string(),
    zipCode: z.string(),
    address1: z.string(),
    address2: z.string().optional(),
    deliveryMemo: z.string().max(100).optional(),
  }),
  guest: z
    .object({ name: z.string(), phone: z.string(), email: z.string(), orderPassword: z.string() })
    .optional(),
  cashReceipt: cashReceiptRequestSchema.optional(),
  coupon: couponRef,
  pointAmount: z.number().int().min(0),
});
export type StartPaymentInput = z.infer<typeof startSchema>;

/**
 * 결제 시작 — 서버에서 한다(구매자 토큰을 브라우저에 두지 않는다). 결제 시작 값은 JSON 문자열로 넘기고
 * 브라우저가 SDK 스키마로 다시 읽는다.
 */
export const startPaymentFn = createServerFn({ method: "POST" })
  .validator(startSchema)
  .handler(
    async ({
      data,
    }): Promise<{
      start: string | null;
      error: string | null;
      failed: "coupon" | "points" | null;
    }> => {
      const returnUrl = new URL(PAYMENT_RETURN_PATH, new URL(getRequestUrl()).origin);
      returnUrl.searchParams.set("back", data.back);
      try {
        const start = await checkoutApi().checkout.startPayment(data.checkoutId, {
          ...(data.option ? { option: data.option } : {}),
          returnUrl: returnUrl.toString(),
          shippingAddress: data.shippingAddress,
          guest: readToken() ? undefined : data.guest,
          cashReceipt: data.cashReceipt,
          ...(data.coupon ? { coupons: [data.coupon] } : {}),
          ...(data.pointAmount ? { pointAmount: data.pointAmount } : {}),
        });
        return { start: JSON.stringify(start), error: null, failed: null };
      } catch (error) {
        const code = error instanceof ApiError ? error.code : null;
        const failed = code?.startsWith("COUPON")
          ? "coupon"
          : code?.startsWith("POINT")
            ? "points"
            : null;
        return { start: null, error: startErrorMessage(code), failed };
      }
    },
  );

function startErrorMessage(code: string | null): string {
  switch (code) {
    case "PAYMENT_OPTION_UNAVAILABLE":
      return "이 결제수단은 지금 사용할 수 없습니다. 다른 결제수단을 선택하십시오.";
    case "PAYMENT_PROVIDER_UNAVAILABLE":
      return "결제사 연결이 원활하지 않습니다. 잠시 뒤 다시 시도하십시오.";
    case "PAYMENT_NOT_CONFIGURED":
      return "지금은 주문을 받지 않습니다.";
    case "CHECKOUT_EXPIRED":
    case "CHECKOUT_NOT_FOUND":
      return "주문서 시간이 지났습니다. 장바구니에서 다시 주문하십시오.";
    case "POINT_BALANCE_CHANGED":
      return "적립금 잔액이 바뀌었습니다. 다시 적용하십시오.";
    case "POINT_NOT_APPLICABLE":
      return "적립금을 사용할 수 없습니다.";
    case "OUT_OF_STOCK":
      return "품절된 상품이 있습니다. 장바구니를 확인하십시오.";
    default:
      return code?.startsWith("COUPON")
        ? couponErrorMessage(code)
        : "결제를 시작하지 못했습니다. 다시 시도하십시오.";
  }
}

export function couponErrorMessage(code: string | null): string {
  switch (code) {
    case "COUPON_NOT_FOUND":
      return "쿠폰을 찾을 수 없습니다. 코드를 다시 확인하십시오.";
    case "TOO_MANY_REQUESTS":
      return "잠시 뒤 다시 입력하십시오.";
    case "COUPON_IN_USE":
      return "다른 결제에서 사용 중인 쿠폰입니다.";
    case "COUPON_LIMIT_REACHED":
    case "COUPON_EXHAUSTED":
      return "더 사용할 수 없는 쿠폰입니다.";
    default:
      return "쿠폰을 적용하지 못했습니다.";
  }
}

/** 쿠폰을 적용하지 못한 사유 → 안내 */
export function couponRejectMessage(reason: string | null): string {
  switch (reason) {
    case "MIN_ORDER_AMOUNT":
      return "최소 주문 금액에 미치지 못합니다.";
    case "NO_ELIGIBLE_ITEMS":
    case "LINE_NOT_ELIGIBLE":
      return "쿠폰을 쓸 수 있는 상품이 없습니다.";
    case "MEMBER_ONLY":
      return "회원만 쓸 수 있는 쿠폰입니다.";
    case "EXPIRED":
      return "기간이 지난 쿠폰입니다.";
    case "NOT_STARTED":
      return "아직 쓸 수 없는 쿠폰입니다.";
    default:
      return "이 주문에는 쓸 수 없는 쿠폰입니다.";
  }
}

/** 적립금을 적용하지 못한 사유 → 안내 */
export function pointRejectMessage(reason: string | null, minAmount: number): string {
  switch (reason) {
    case "MIN_AMOUNT":
      return `적립금은 ${minAmount.toLocaleString("ko-KR")}원부터 사용합니다.`;
    case "GUEST":
    case "USE_DISABLED":
    case "NOT_PAYABLE":
      return "이 주문에는 적립금을 사용할 수 없습니다.";
    default:
      return "적립금을 적용하지 못했습니다.";
  }
}
