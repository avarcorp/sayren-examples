import type { Cart } from "@sayren/storefront-sdk";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cartApi } from "./cart-api.server";
import type { CheckoutSearch } from "./checkout-intent";
import { clearDirectLine, writeDirectLine } from "./direct-checkout.server";
import { messageOf } from "./errors";
import { LineTooLargeError, lineRequestSchema, MAX_LINE_QUANTITY } from "./line-request";
import { readToken } from "./session.server";

/**
 * 장바구니 — 토큰도 장바구니 쿠키도 없으면 API를 부르지 않는다(빈 장바구니).
 * 조회에서도 쿠키를 다시 심는다. 서버는 만료된 토큰이면 새 익명 세션을 주고, 쿠키 만료도 조회로 연장해야 한다.
 */
export const getCartFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ cart: Cart | null; loggedIn: boolean }> => {
    const { api, persist, hasCart } = cartApi();
    if (!hasCart) return { cart: null, loggedIn: false };
    const cart = await api.cart.get();
    persist();
    return { cart, loggedIn: Boolean(readToken()) };
  },
);

export const cartQuery = () => queryOptions({ queryKey: ["cart"], queryFn: () => getCartFn() });

export const addToCartFn = createServerFn({ method: "POST" })
  .validator(lineRequestSchema)
  .handler(async ({ data }): Promise<{ error: string | null }> => {
    const { api, persist } = cartApi();
    try {
      await api.cart.addItem(data);
      return { error: null };
    } catch (error) {
      return { error: messageOf(error, "장바구니에 담지 못했습니다.") };
    } finally {
      persist();
    }
  });

export const updateCartItemFn = createServerFn({ method: "POST" })
  .validator(
    z.object({ cartItemId: z.string(), quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY) }),
  )
  .handler(async ({ data }): Promise<{ error: string | null }> => {
    const { api, persist } = cartApi();
    try {
      await api.cart.updateItem(data.cartItemId, { quantity: data.quantity });
      return { error: null };
    } catch (error) {
      return { error: messageOf(error, "수량을 바꾸지 못했습니다.") };
    } finally {
      persist();
    }
  });

export const removeCartItemsFn = createServerFn({ method: "POST" })
  .validator(z.object({ cartItemIds: z.array(z.string()).min(1).max(100) }))
  .handler(async ({ data }): Promise<{ error: string | null }> => {
    const { api, persist } = cartApi();
    try {
      for (const id of data.cartItemIds) await api.cart.removeItem(id);
      return { error: null };
    } catch (error) {
      return { error: messageOf(error, "장바구니에서 빼지 못했습니다.") };
    } finally {
      persist();
    }
  });

/**
 * 바로구매 — 추가 선택·직접 입력이 있으면 그 줄을 HttpOnly 쿠키에 두고 주소에는 `direct=1`과 상품 id만 싣는다.
 * 고른 것이 없으면 조건을 주소에 싣는다.
 */
export const prepareDirectCheckoutFn = createServerFn({ method: "POST" })
  .validator(lineRequestSchema)
  .handler(async ({ data }): Promise<{ search: CheckoutSearch | null; error: string | null }> => {
    if (data.addons?.length || data.customInputs?.length || data.stay) {
      try {
        writeDirectLine(data);
      } catch (error) {
        if (!(error instanceof LineTooLargeError)) throw error;
        return { search: null, error: "입력한 내용이 너무 깁니다. 줄여서 다시 시도하십시오." };
      }
      return { search: { direct: 1, productId: data.productId }, error: null };
    }
    clearDirectLine();
    return {
      search: { productId: data.productId, optionId: data.optionId, quantity: data.quantity },
      error: null,
    };
  });
