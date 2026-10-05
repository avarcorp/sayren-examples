import type { Cart } from "@sayren/storefront-sdk";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { m } from "../i18n";
import { apiFor } from "./api.server";
import { readCartToken, writeCartToken } from "./cart-session.server";
import type { CheckoutSearch } from "./checkout-intent";
import { clearDirectLine, writeDirectLine } from "./direct-checkout.server";
import { LineTooLargeError, lineRequestSchema } from "./line-request";
import { readToken } from "./session.server";

/**
 * 장바구니 담기 — 서버에서 처리한다. 비회원 장바구니 토큰은 서버가 새로 발급할 수 있어
 * 응답 쿠키에 다시 심는다. 상품 상세와 홈의 상품 소개 섹션(`productSpotlight`)이 같은 함수를 쓴다.
 */
export const addToCart = createServerFn({ method: "POST" })
  .validator(lineRequestSchema)
  .handler(async ({ data }) => {
    const cartToken = readCartToken();
    let issued: string | null = null;
    const api = apiFor({
      accessToken: readToken(),
      cartToken,
      onCartToken: (token) => {
        issued = token;
      },
    });
    await api.cart.addItem(data);
    const token = issued ?? cartToken;
    if (token) writeCartToken(token);
  });

/**
 * 추가 선택·직접 입력이 있는 바로구매 — 조건을 URL에 싣지 않고 HttpOnly 쿠키에 둔 뒤 `direct=1`과 상품 id만 돌려준다.
 * 직접 입력값은 개인정보가 섞일 수 있어 방문 기록·서버 로그·리퍼러에 남기지 않는다. 쿠키는 주문 완료·로그아웃 때 지운다.
 * 고른 것이 없으면 기존처럼 URL 조건이다.
 */
export const prepareDirectCheckout = createServerFn({ method: "POST" })
  .validator(lineRequestSchema)
  .handler(async ({ data }): Promise<{ search: CheckoutSearch | null; error: string | null }> => {
    // 숙박 기간(#118)도 URL 조건에 없으므로 쿠키 경로로 보낸다
    if (data.addons?.length || data.customInputs?.length || data.stay) {
      try {
        writeDirectLine(data);
      } catch (error) {
        if (!(error instanceof LineTooLargeError)) throw error;
        return {
          search: null,
          error: m.cart_actions_line_too_large(),
        };
      }
      return { search: { direct: 1, productId: data.productId }, error: null };
    }
    // 전에 남긴 입력값이 있으면 지운다 — 쓰지 않을 값을 요청마다 싣고 다니지 않는다
    clearDirectLine();
    return {
      search: { productId: data.productId, optionId: data.optionId, quantity: data.quantity },
      error: null,
    };
  });

/**
 * 여러 조합 바로구매 — 주문서는 바로구매 한 줄만 받으므로 선택 행을 장바구니에 담고 그 항목들로 주문서를 연다.
 * 장바구니에 같은 조합이 이미 있으면 서버가 수량을 합친다(그 수량 그대로 주문서에 실린다).
 */
export const prepareMultiCheckout = createServerFn({ method: "POST" })
  .validator(z.object({ lines: z.array(lineRequestSchema).min(1).max(50) }))
  .handler(async ({ data }): Promise<{ search: CheckoutSearch | null; error: string | null }> => {
    const cartToken = readCartToken();
    let issued: string | null = null;
    let cart: Cart | null = null;
    // 한 줄씩 담는다 — 장바구니 토큰이 첫 요청에서 발급되면 다음 요청이 그 토큰을 쓴다
    for (const line of data.lines) {
      cart = await apiFor({
        accessToken: readToken(),
        cartToken: issued ?? cartToken,
        onCartToken: (token) => {
          issued = token;
        },
      }).cart.addItem(line);
    }
    const token = issued ?? cartToken;
    if (token) writeCartToken(token);
    const ids = data.lines.flatMap((line) => {
      const found = [...(cart?.items ?? [])]
        .reverse()
        .find(
          (item) =>
            item.productId === line.productId && (item.optionId ?? undefined) === line.optionId,
        );
      return found ? [found.cartItemId] : [];
    });
    if (!ids.length) return { search: null, error: m.product_purchase_checkout_failed() };
    return { search: { cartItemId: [...new Set(ids)] }, error: null };
  });
