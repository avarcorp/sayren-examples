import {
  addonSelectionSchema,
  customInputEntrySchema,
  guestInfoSchema,
  paymentOptionSchema,
  shippingAddressInputSchema,
} from "@sayren/storefront-sdk";
import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";
import { buyerApi } from "./buyer.server";
import type { PublicConfig } from "./config";
import { API_BASE_URL, resolveStoreCode } from "./config.server";
import { attempt } from "./result";

/**
 * 구매 쓰기 — 담기·바로 구매·장바구니·주문서·결제 시작·찜·상품 문의. 모두 서버 함수다(토큰은 서버에만 있다).
 * 직접 입력값(분쇄도)은 서버 함수 본문으로만 오간다. 금액은 계산하지 않고 서버 응답을 그대로 돌려준다.
 */

const PAYMENT_RETURN_PATH = "/checkout/return";

const lineSchema = z.object({
  productId: z.string().min(1),
  optionId: z.string().min(1).optional(),
  quantity: z.number().int().min(1).max(999),
  addons: z.array(addonSelectionSchema).max(20).optional(),
  customInputs: z.array(customInputEntrySchema).max(20).optional(),
});

export const addToCart = createServerFn({ method: "POST" })
  .validator(lineSchema)
  .handler(({ data }) =>
    attempt(async () => {
      const cart = await buyerApi().cart.addItem(data);
      return { count: cart.items.length };
    }),
  );

/** 바로 구매 — 장바구니를 거치지 않고 주문서를 만든다 */
export const buyNow = createServerFn({ method: "POST" })
  .validator(lineSchema)
  .handler(({ data }) =>
    attempt(async () => {
      const checkout = await buyerApi().checkout.create({ directItem: data });
      return { checkoutId: checkout.checkoutId };
    }),
  );

export const updateCartQuantity = createServerFn({ method: "POST" })
  .validator(
    z.object({ cartItemId: z.string().min(1), quantity: z.number().int().min(1).max(999) }),
  )
  .handler(({ data }) =>
    attempt(async () => {
      await buyerApi().cart.updateItem(data.cartItemId, { quantity: data.quantity });
      return null;
    }),
  );

export const removeCartItem = createServerFn({ method: "POST" })
  .validator(z.object({ cartItemId: z.string().min(1) }))
  .handler(({ data }) =>
    attempt(async () => {
      await buyerApi().cart.removeItem(data.cartItemId);
      return null;
    }),
  );

/** 장바구니의 구매 가능한 줄로 주문서를 만든다 */
export const checkoutFromCart = createServerFn({ method: "POST" })
  .validator(z.object({ cartItemIds: z.array(z.string().min(1)).min(1) }))
  .handler(({ data }) =>
    attempt(async () => {
      const checkout = await buyerApi().checkout.create({ cartItemIds: data.cartItemIds });
      return { checkoutId: checkout.checkoutId };
    }),
  );

/** 우편번호가 정해지면 배송비를 다시 계산한다(주문서를 바꾸지 않는 읽기 계산) */
export const quoteDelivery = createServerFn({ method: "POST" })
  .validator(z.object({ checkoutId: z.string().min(1), zipCode: z.string().regex(/^[0-9]{5}$/) }))
  .handler(({ data }) =>
    attempt(() => buyerApi().checkout.quoteDelivery(data.checkoutId, { zipCode: data.zipCode })),
  );

/**
 * 결제 시작 — 서버가 결제를 만들고 결제창 호출 값을 돌려준다. 결제창은 브라우저가 `/payments`의 `open`으로 연다.
 * 복귀 주소는 요청 origin으로 만든다(주소를 코드에 고정하지 않는다)
 */
export const startPayment = createServerFn({ method: "POST" })
  .validator(
    z.object({
      checkoutId: z.string().min(1),
      option: paymentOptionSchema,
      shippingAddress: shippingAddressInputSchema.optional(),
      guest: guestInfoSchema.optional(),
    }),
  )
  .handler(({ data }) =>
    attempt(async () => {
      const returnUrl = new URL(PAYMENT_RETURN_PATH, new URL(getRequestUrl()).origin).toString();
      const start = await buyerApi().checkout.startPayment(data.checkoutId, {
        option: data.option,
        shippingAddress: data.shippingAddress,
        guest: data.guest,
        returnUrl,
      });
      // 결제 시작 값은 브라우저의 payments.open에 그대로 넘긴다(문자열로 실어 형태를 지킨다)
      return JSON.stringify(start);
    }),
  );

/** 브라우저 결제 모듈이 쓰는 공개 설정 */
export const getPaymentConfig = createServerFn({ method: "GET" }).handler(
  (): PublicConfig => ({ apiBaseUrl: API_BASE_URL, storeCode: resolveStoreCode() }),
);

export const setWishlist = createServerFn({ method: "POST" })
  .validator(z.object({ productId: z.string().min(1), on: z.boolean() }))
  .handler(({ data }) =>
    attempt(async () => {
      if (data.on) await buyerApi().member.addWishlist(data.productId);
      else await buyerApi().member.removeWishlist(data.productId);
      return { on: data.on };
    }),
  );

export const createProductInquiry = createServerFn({ method: "POST" })
  .validator(
    z.object({
      productId: z.string().min(1),
      content: z.string().min(1).max(1000),
      secret: z.boolean(),
      category: z.enum(["PRODUCT", "DELIVERY", "RETURN", "EXCHANGE", "ETC"]),
    }),
  )
  .handler(({ data }) =>
    attempt(() =>
      buyerApi().catalog.createInquiry(data.productId, {
        content: data.content,
        secret: data.secret,
        category: data.category,
      }),
    ),
  );
