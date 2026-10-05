import type { CheckoutDelivery } from "@sayren/storefront-sdk";
import { m } from "../../i18n";
import { formatPrice } from "../../lib/format";

/**
 * 결제 금액 표 — 값은 모두 서버 값이다(주문서·배송비 견적·쿠폰/적립금 미리보기·결제 시작 응답). 화면은 더하거나 빼지 않는다.
 * `delivery`가 null이면 배송이 필요 없는 주문이라 배송비 줄이 없다. `pointDiscount`가 null이면 적립금을 쓰지 않는 상점이다.
 */
export function AmountSummary({
  productAmount,
  delivery,
  couponDiscount,
  pointDiscount,
  totalAmount,
}: {
  productAmount: number;
  delivery: CheckoutDelivery | null;
  couponDiscount: number;
  pointDiscount: number | null;
  totalAmount: number;
}) {
  return (
    <dl className="flex flex-col gap-3 text-body">
      <Row label={m.checkout_product_amount()} value={formatPrice(productAmount)} />
      {/* 배송비는 배송 묶음(같은 출고지 + 같은 배송 정책)마다 한 번 붙고, 지역 추가 배송비는 묶음마다 더한다 */}
      {delivery ? (
        <Row label={m.checkout_base_delivery_fee()} value={formatPrice(delivery.baseFee)} />
      ) : null}
      {delivery && delivery.remoteSurcharge > 0 ? (
        <Row
          label={m.checkout_remote_surcharge({
            area: delivery.remoteAreaLabel ?? m.checkout_remote_area_default(),
          })}
          value={formatPrice(delivery.remoteSurcharge)}
        />
      ) : null}
      <Row
        label={m.checkout_coupon_discount()}
        value={couponDiscount > 0 ? `−${formatPrice(couponDiscount)}` : formatPrice(0)}
        point={couponDiscount > 0}
      />
      {pointDiscount !== null ? (
        <Row
          label={m.checkout_points_discount()}
          value={pointDiscount > 0 ? `−${formatPrice(pointDiscount)}` : formatPrice(0)}
        />
      ) : null}
      <div className="mt-1 flex items-baseline justify-between gap-3 border-ink border-t pt-4">
        <dt className="font-bold text-body-lg md:text-base">{m.checkout_total_amount()}</dt>
        <dd className="tabular font-bold text-[1.375rem] tracking-tight md:text-2xl">
          {formatPrice(totalAmount)}
        </dd>
      </div>
    </dl>
  );
}

function Row({ label, value, point = false }: { label: string; value: string; point?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="min-w-0 text-sub">{label}</dt>
      <dd className={`tabular shrink-0 ${point ? "text-point" : ""}`}>{value}</dd>
    </div>
  );
}
