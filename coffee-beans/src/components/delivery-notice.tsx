import { deliveryNoticeOf, type ProductFulfillmentView } from "@sayren/storefront-sdk";
import { m } from "../i18n";
import { formatMoney } from "../lib/format";

/**
 * 배송 안내 — deliveryNoticeOf 결과로만 배송비 문구를 만든다(금액을 코드에 적지 않는다).
 * 발송 시점은 주문 후 로스팅이라 상품의 안내 섹션 「로스팅·발송」이 원천이다 — 플랫폼 기본 예상 기간(estimatedDays)은 그 약속과 어긋나 보이지 않는다
 */
export function DeliveryNotice({
  fulfillment,
  currency,
}: {
  fulfillment: ProductFulfillmentView;
  currency: string;
}) {
  const notice = deliveryNoticeOf(fulfillment);
  let fee: string;
  switch (notice.kind) {
    case "FREE":
      fee = m.delivery_free();
      break;
    case "PAID":
      fee = m.delivery_paid({ fee: formatMoney(notice.fee, currency) });
      break;
    case "CONDITIONAL_FREE":
      fee = m.delivery_conditional({
        fee: formatMoney(notice.fee, currency),
        over: formatMoney(notice.freeOver, currency),
      });
      break;
    case "NO_SHIPPING":
      fee = m.delivery_none();
      break;
    default:
      fee = m.delivery_unknown();
  }
  return (
    <dl className="grid grid-cols-[4.5rem_1fr] gap-y-1.5 text-meta">
      <dt className="text-muted">{m.delivery_label()}</dt>
      <dd className="min-w-0 break-words">{fee}</dd>
    </dl>
  );
}
