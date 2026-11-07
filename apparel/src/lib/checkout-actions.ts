import {
  guestInfoSchema,
  paymentOptionSchema,
  shippingAddressInputSchema,
} from "@sayren/storefront-sdk";
import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";
import { failureOf } from "./api-errors";
import type { PublicConfig } from "./config";
import { API_BASE_URL, resolveStoreCode } from "./config.server";
import { buyerApi } from "./session.server";
import type { ActionResult } from "./shop-actions";

/**
 * 주문서 서버 함수 — 배송비 다시 계산(우편번호), 적립금 금액 미리보기, 결제 시작.
 * 금액은 모두 서버 응답이다. 결제창은 브라우저가 `@sayren/storefront-sdk/payments`로 연다.
 */

export const PAYMENT_RETURN_PATH = "/checkout/return";

/** 브라우저 결제 모듈이 쓰는 공개 설정 */
export const getPublicConfig = createServerFn({ method: "GET" }).handler(
  (): PublicConfig => ({ apiBaseUrl: API_BASE_URL, storeCode: resolveStoreCode() }),
);

/** 우편번호가 바뀌면 배송비(제주·도서산간 포함)를 다시 계산한다 — 주문서를 바꾸지 않는 읽기 계산 */
export const quoteDelivery = createServerFn({ method: "POST" })
  .validator(z.object({ checkoutId: z.string().min(1), zipCode: z.string().regex(/^\d{5}$/) }))
  .handler(async ({ data }) => {
    try {
      const quote = await buyerApi().checkout.quoteDelivery(data.checkoutId, {
        zipCode: data.zipCode,
      });
      return { ok: true as const, amounts: quote.amounts, delivery: quote.delivery };
    } catch (error) {
      return failureOf(error);
    }
  });

/** 적립금을 쓰면 서버가 실제 사용액·결제 금액·결제 필요 여부를 계산한다 */
export const previewPricing = createServerFn({ method: "POST" })
  .validator(
    z.object({
      checkoutId: z.string().min(1),
      pointAmount: z.number().int().min(0),
      zipCode: z
        .string()
        .regex(/^\d{5}$/)
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const pricing = await buyerApi().checkout.pricing(data.checkoutId, {
        coupons: [],
        pointAmount: data.pointAmount,
        zipCode: data.zipCode,
      });
      return {
        ok: true as const,
        amounts: pricing.amounts,
        paymentRequired: pricing.paymentRequired,
        payable: pricing.payable,
      };
    } catch (error) {
      return failureOf(error);
    }
  });

/**
 * 결제 시작 — 복귀 주소는 요청 origin으로 만든다(호스트를 코드에 적지 않는다). 결과는 JSON 문자열이고
 * 브라우저가 `paymentStartSchema`로 읽어 결제창을 연다
 */
export const startPayment = createServerFn({ method: "POST" })
  .validator(
    z.object({
      checkoutId: z.string().min(1),
      option: paymentOptionSchema.optional(),
      shippingAddress: shippingAddressInputSchema.optional(),
      guest: guestInfoSchema.optional(),
      pointAmount: z.number().int().min(0).optional(),
    }),
  )
  .handler(async ({ data }): Promise<ActionResult<{ start: string }>> => {
    try {
      const returnUrl = new URL(PAYMENT_RETURN_PATH, new URL(getRequestUrl()).origin).toString();
      const start = await buyerApi().checkout.startPayment(data.checkoutId, {
        option: data.option,
        returnUrl,
        shippingAddress: data.shippingAddress,
        guest: data.guest,
        pointAmount: data.pointAmount || undefined,
      });
      return { ok: true, start: JSON.stringify(start) };
    } catch (error) {
      return failureOf(error);
    }
  });
