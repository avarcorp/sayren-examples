import type { DeliveryNotice } from "@sayren/storefront-sdk";
import { m } from "../i18n";
import { formatMoney } from "./format";

/** 배송 안내 한 줄 — `deliveryNoticeOf` 결과로만 만든다(배송비를 화면에 적지 않는다). 모르면 null */
export function deliveryNoticeText(notice: DeliveryNotice, currency?: string): string | null {
  switch (notice.kind) {
    case "FREE":
      return m.delivery_free();
    case "PAID":
      return m.delivery_paid({ fee: formatMoney(notice.fee, currency) });
    case "CONDITIONAL_FREE":
      return m.delivery_conditional({
        fee: formatMoney(notice.fee, currency),
        freeOver: formatMoney(notice.freeOver, currency),
      });
    case "UNKNOWN":
      return m.delivery_unknown();
    default:
      return null;
  }
}
