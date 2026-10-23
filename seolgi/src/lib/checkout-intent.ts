import { z } from "zod";
import type { LineRequest } from "./line-request";

/**
 * 주문서 진입 의도 — URL 검색 파라미터. 주문서 세션은 다시 조회할 수 없어 진입마다 새로 만든다.
 * 조건이 URL에 있으면 새로고침·뒤로가기가 그대로 동작한다. 가격·재고·소유는 서버가 다시 확인한다.
 * 추가 선택·직접 입력이 있는 바로구매는 `direct=1`만 두고 조건은 HttpOnly 쿠키에서 읽는다.
 */
const stringList = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .catch(undefined);

export const checkoutSearch = z.object({
  cartItemId: stringList,
  productId: z.string().optional().catch(undefined),
  optionId: z.string().optional().catch(undefined),
  quantity: z.coerce.number().optional().catch(undefined),
  direct: z.coerce.number().pipe(z.literal(1)).optional().catch(undefined),
});
export type CheckoutSearch = z.infer<typeof checkoutSearch>;

export interface CheckoutIntent {
  cartItemIds?: string[];
  directItem?: LineRequest;
}

/** `direct=1`이면 쿠키의 한 줄(`directLine`)이 주소의 상품과 같을 때만 쓴다(다른 탭의 바로구매와 섞이지 않게) */
export function checkoutIntentFrom(
  search: CheckoutSearch,
  directLine: LineRequest | null = null,
): CheckoutIntent | null {
  const cartItemIds = [search.cartItemId ?? []].flat().filter(Boolean);
  if (cartItemIds.length) return { cartItemIds };
  if (search.direct) {
    return directLine && directLine.productId === search.productId
      ? { directItem: directLine }
      : null;
  }
  if (!search.productId) return null;
  const quantity = search.quantity ?? 1;
  return {
    directItem: {
      productId: search.productId,
      optionId: search.optionId || undefined,
      quantity: Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1,
    },
  };
}
