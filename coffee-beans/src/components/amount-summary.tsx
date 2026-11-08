import { m } from "../i18n";
import { formatMoney } from "../lib/format";

/** 금액 요약 — 서버 응답 값을 그대로 보인다(합계를 화면에서 계산하지 않는다) */
export function AmountSummary({
  currency,
  productAmount,
  deliveryFee,
  couponDiscountAmount = 0,
  deliveryDiscountAmount = 0,
  pointAmount = 0,
  totalAmount,
  totalLabel,
}: {
  currency: string;
  productAmount: number;
  deliveryFee: number;
  couponDiscountAmount?: number;
  deliveryDiscountAmount?: number;
  pointAmount?: number;
  totalAmount: number;
  totalLabel?: string;
}) {
  const row = "flex items-center justify-between gap-3 text-body";
  return (
    <dl className="flex flex-col gap-2">
      <div className={row}>
        <dt className="text-sub">{m.amount_products()}</dt>
        <dd className="tabular">{formatMoney(productAmount, currency)}</dd>
      </div>
      <div className={row}>
        <dt className="text-sub">{m.amount_delivery()}</dt>
        <dd className="tabular">
          {deliveryFee === 0 ? m.amount_delivery_free() : formatMoney(deliveryFee, currency)}
        </dd>
      </div>
      {couponDiscountAmount > 0 ? (
        <div className={row}>
          <dt className="text-sub">{m.amount_coupon()}</dt>
          <dd className="text-sale tabular">-{formatMoney(couponDiscountAmount, currency)}</dd>
        </div>
      ) : null}
      {deliveryDiscountAmount > 0 ? (
        <div className={row}>
          <dt className="text-sub">{m.amount_delivery_discount()}</dt>
          <dd className="text-sale tabular">-{formatMoney(deliveryDiscountAmount, currency)}</dd>
        </div>
      ) : null}
      {pointAmount > 0 ? (
        <div className={row}>
          <dt className="text-sub">{m.amount_points()}</dt>
          <dd className="text-sale tabular">-{formatMoney(pointAmount, currency)}</dd>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3 border-line border-t pt-3">
        <dt className="font-semibold text-body">{totalLabel ?? m.amount_total()}</dt>
        <dd className="font-bold text-lg tabular">{formatMoney(totalAmount, currency)}</dd>
      </div>
    </dl>
  );
}
