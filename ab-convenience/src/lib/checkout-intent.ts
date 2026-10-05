import { z } from "zod";
import type { LineRequest } from "./line-request";

/**
 * 주문서 진입 의도 — URL 검색 파라미터로 받는다.
 *
 * 스토어프론트 API에는 "만들어 둔 주문서 다시 조회"가 없다. 주문서 세션은 만들 때 한 번 내려오고
 * 짧게 만료된다. 그래서 주문서 화면은 들어올 때마다 세션을 새로 만든다. 조건이 URL에 있으면
 * 새로고침·뒤로가기·링크 공유가 그대로 동작한다.
 *
 * 값을 사용자가 바꿀 수 있지만 위험하지 않다. 장바구니 항목은 장바구니 토큰으로 소유가 확인되고,
 * 가격·재고는 서버가 다시 계산한다.
 *
 * 추가 선택·직접 입력(각인 문구 등)이 있는 바로구매는 조건을 URL에 싣지 않는다 — `direct=1`만 두고 조건은
 * HttpOnly 쿠키에서 읽는다(`direct-checkout.server.ts`). 직접 입력값은 개인정보가 섞일 수 있다.
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
  /** 추가 선택·직접 입력이 있는 바로구매 — 조건은 쿠키에 있고 주소에는 상품 id만 둔다 */
  direct: z.coerce.number().pipe(z.literal(1)).optional().catch(undefined),
  /** 받는 방법 — 배달(`DIRECT`)·포장(`PICKUP`). 주문서 `fulfillmentMethod`로 보낸다. 없으면 상품 기본 방식이다 */
  method: z.enum(["DIRECT", "PICKUP"]).optional().catch(undefined),
  /** 포장일 때 고른 픽업 장소(`GET /pickup-locations`의 `locationId`) */
  pickup: z.string().optional().catch(undefined),
});
export type CheckoutSearch = z.infer<typeof checkoutSearch>;

export interface CheckoutIntent {
  cartItemIds?: string[];
  directItem?: LineRequest;
  fulfillmentMethod?: "DIRECT" | "PICKUP";
  pickupLocationId?: string;
}

/** 받는 방법·픽업 장소를 주문서 요청에 붙인다. 포장이 아니면 픽업 장소를 보내지 않는다(400 `PICKUP_LOCATION_NOT_APPLICABLE`) */
export function withReceiveMethod(intent: CheckoutIntent, search: CheckoutSearch): CheckoutIntent {
  if (!search.method) return intent;
  return {
    ...intent,
    fulfillmentMethod: search.method,
    ...(search.method === "PICKUP" && search.pickup ? { pickupLocationId: search.pickup } : {}),
  };
}

/**
 * @param directLine `direct=1`일 때 쿠키에서 읽은 바로구매 한 줄. 쿠키가 없거나 만료됐으면 null이고,
 *   그러면 주문서를 만들 수 없다(null을 돌려준다 — 호출부가 장바구니로 보낸다).
 */
export function checkoutIntentFrom(
  search: CheckoutSearch,
  directLine: LineRequest | null = null,
): CheckoutIntent | null {
  const cartItemIds = [search.cartItemId ?? []].flat().filter(Boolean);
  if (cartItemIds.length) return { cartItemIds };

  if (search.direct) {
    // 다른 탭에서 다른 상품을 바로구매하면 쿠키가 바뀐다 — 주소의 상품과 같을 때만 쓴다
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
