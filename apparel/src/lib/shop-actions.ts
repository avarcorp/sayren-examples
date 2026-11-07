import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { failureOf } from "./api-errors";
import { buyerApi } from "./session.server";

/**
 * 상품 상세의 구매자 행동(서버 함수) — 장바구니 담기, 바로 구매, 찜, 문의 작성.
 * 결과는 `{ ok: true, … }` 또는 `{ ok: false, code, message }`이고 화면은 message를 그대로 보인다.
 */

export type ActionResult<T = object> =
  | ({ ok: true } & T)
  | { ok: false; code: string; message: string };

const lineSchema = z.object({
  productId: z.string().min(1),
  optionId: z.string().optional(),
  quantity: z.number().int().min(1).max(999),
});

export const addToCart = createServerFn({ method: "POST" })
  .validator(lineSchema)
  .handler(async ({ data }): Promise<ActionResult> => {
    try {
      await buyerApi().cart.addItem(data);
      return { ok: true };
    } catch (error) {
      return failureOf(error);
    }
  });

/** 바로 구매 — 장바구니를 거치지 않고 주문서를 만들고 그 id를 돌려준다 */
export const buyNow = createServerFn({ method: "POST" })
  .validator(lineSchema)
  .handler(async ({ data }): Promise<ActionResult<{ checkoutId: string }>> => {
    try {
      const checkout = await buyerApi().checkout.create({ directItem: data });
      return { ok: true, checkoutId: checkout.checkoutId };
    } catch (error) {
      return failureOf(error);
    }
  });

export const toggleWishlist = createServerFn({ method: "POST" })
  .validator(z.object({ productId: z.string().min(1), add: z.boolean() }))
  .handler(async ({ data }): Promise<ActionResult> => {
    try {
      const api = buyerApi();
      if (data.add) await api.member.addWishlist(data.productId);
      else await api.member.removeWishlist(data.productId);
      return { ok: true };
    } catch (error) {
      return failureOf(error);
    }
  });

export const createProductInquiry = createServerFn({ method: "POST" })
  .validator(
    z.object({
      productId: z.string().min(1),
      content: z.string().min(1).max(1000),
      secret: z.boolean(),
    }),
  )
  .handler(async ({ data }): Promise<ActionResult> => {
    try {
      await buyerApi().catalog.createInquiry(data.productId, {
        content: data.content,
        secret: data.secret,
      });
      return { ok: true };
    } catch (error) {
      return failureOf(error);
    }
  });
