import type { StorefrontStore } from "@sayren/storefront-sdk";
import { m } from "../i18n";

/**
 * 주문 받기 상태 — `GET /store`의 `checkoutAvailable`을 화면 규칙으로 옮긴다. 판정은 서버가 하고 화면은 따르기만 한다.
 *
 * `checkoutAvailable`이 false면 결제 요청이 409 `PAYMENT_NOT_CONFIGURED`다(결제 수단이 없거나, 공개한 쇼핑몰의 실결제가 아직
 * 열리지 않았다). 그때는 장바구니 담기·바로구매·주문 버튼과 헤더의 장바구니를 그리지 않고 문의 안내를 보인다.
 */
export interface Ordering {
  /** 주문 버튼을 그리는가 */
  open: boolean;
  /** 주문을 받지 않을 때의 안내 — 주문을 받으면 null */
  notice: string | null;
  /** 문의 전화 — 주문을 받지 않고 고객센터 전화가 있을 때만 */
  phone: string | null;
}

/** 상점 설정을 읽지 못하면(null) 주문을 받는 것으로 둔다 — 최종 판정은 결제 요청이 한다 */
export function orderingOf(
  store: Pick<StorefrontStore, "checkoutAvailable" | "customerCenterPhone"> | null,
): Ordering {
  if (store?.checkoutAvailable !== false) return { open: true, notice: null, phone: null };
  return {
    open: false,
    notice: m.ordering_closed_notice(),
    phone: store.customerCenterPhone?.trim() || null,
  };
}
