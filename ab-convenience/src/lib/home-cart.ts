import { ApiError } from "@sayren/storefront-sdk";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { m } from "../i18n";
import { apiFor } from "./api.server";
import { readCartToken, writeCartToken } from "./cart-session.server";
import { readToken } from "./session.server";

/**
 * 홈 목록의 담기·빼기 — 한 개씩 바꾼다. 담기는 옵션 없는 상품만이다(옵션을 골라야 하면 서버가 거절하고 상품 화면으로 보낸다).
 * 수량을 0으로 내리면 줄을 지운다. 비회원 장바구니 토큰은 서버가 새로 발급할 수 있어 응답 쿠키에 다시 심는다.
 */
export const changeHomeCart = createServerFn({ method: "POST" })
  .validator(
    z.discriminatedUnion("intent", [
      z.object({ intent: z.literal("add"), productId: z.string() }),
      z.object({
        intent: z.literal("set"),
        cartItemId: z.string(),
        quantity: z.number().int().min(0).max(999),
      }),
    ]),
  )
  .handler(async ({ data }): Promise<{ error: string | null; needsOptions: boolean }> => {
    const cartToken = readCartToken();
    let issued: string | null = null;
    const api = apiFor({
      accessToken: readToken(),
      cartToken,
      onCartToken: (token) => {
        issued = token;
      },
    });
    try {
      if (data.intent === "add") await api.cart.addItem({ productId: data.productId, quantity: 1 });
      else if (data.quantity === 0) await api.cart.removeItem(data.cartItemId);
      else await api.cart.updateItem(data.cartItemId, { quantity: data.quantity });
    } catch (error) {
      if (error instanceof ApiError && data.intent === "add" && error.status === 400) {
        return { error: null, needsOptions: true };
      }
      return {
        error: error instanceof ApiError ? error.message : m.home_cart_failed(),
        needsOptions: false,
      };
    }
    const token = issued ?? cartToken;
    if (token) writeCartToken(token);
    return { error: null, needsOptions: false };
  });
