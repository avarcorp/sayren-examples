import type { StorefrontStore } from "@sayren/storefront-sdk";
import { type Ordering, orderingOf } from "../lib/ordering";
import type { SiteLayout } from "./layout-schema";

/**
 * 이 사이트가 지금 주문을 받는가 — 상점의 주문 가능 상태(`checkoutAvailable`)와 레이아웃의 주문 방식(`commerce.mode`)을 합친다.
 *
 * 카탈로그형(`catalog`)은 `checkoutAvailable`이 false인 상점과 같은 화면을 강제한다. 담기·바로구매·장바구니를 숨기고
 * 문의 안내(고객센터 전화)를 보인다. 결제 코드는 그대로 있고 판정만 닫힌다 — 주문을 받는 상점에서도 카탈로그형 템플릿은
 * 주문을 받지 않는다. 반대로 `shop`이어도 상점이 주문을 받지 못하면 닫힌다.
 */
export function siteOrderingOf(
  store: Pick<StorefrontStore, "checkoutAvailable" | "customerCenterPhone"> | null,
  mode: SiteLayout["commerce"]["mode"],
): Ordering {
  if (mode === "catalog") {
    return orderingOf({
      checkoutAvailable: false,
      customerCenterPhone: store?.customerCenterPhone ?? null,
    });
  }
  return orderingOf(store);
}
