import { deliveryNoticeOf, type ProductDetail } from "@sayren/storefront-sdk";
import { m } from "../i18n";
import { formatMoney } from "../lib/format";

/** 배송 안내 한 줄 — `deliveryNoticeOf` 결과 그대로 */
export function DeliveryNotice({ product }: { product: ProductDetail }) {
  const notice = deliveryNoticeOf(product.fulfillment);
  const money = (amount: number) => formatMoney(amount, product.currency);
  const text = (() => {
    switch (notice.kind) {
      case "FREE":
        return m.delivery_free();
      case "PAID":
        return m.delivery_paid({ fee: money(notice.fee) });
      case "CONDITIONAL_FREE":
        return m.delivery_conditional({ fee: money(notice.fee), freeOver: money(notice.freeOver) });
      case "NO_SHIPPING":
        return m.delivery_no_shipping();
      default:
        return m.delivery_unknown();
    }
  })();
  const days = "estimatedDays" in notice ? notice.estimatedDays : null;
  return (
    <p className="text-body">
      {text}
      {days ? <span className="text-sub"> · {m.delivery_days({ days })}</span> : null}
    </p>
  );
}
