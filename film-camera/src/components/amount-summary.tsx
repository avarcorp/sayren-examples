import { m } from "../i18n";
import { formatMoney } from "../lib/format";

export interface AmountRows {
  productAmount: number;
  deliveryFee: number;
  totalAmount: number;
  couponDiscountAmount?: number;
  deliveryDiscountAmount?: number;
  pointAmount?: number;
}

/** 금액 행 — 응답 값을 그대로 보인다(화면에서 계산하지 않는다) */
export function AmountSummary({
  amounts,
  currency,
  remote,
}: {
  amounts: AmountRows;
  currency: string;
  remote?: { label: string; amount: number } | null;
}) {
  const money = (n: number) => formatMoney(n, currency);
  const rows: { key: string; label: string; value: string }[] = [
    { key: "product", label: m.amount_product(), value: money(amounts.productAmount) },
    { key: "delivery", label: m.amount_delivery(), value: money(amounts.deliveryFee) },
  ];
  if (remote && remote.amount > 0)
    rows.push({
      key: "remote",
      label: m.amount_remote({ area: remote.label }),
      value: money(remote.amount),
    });
  if (amounts.deliveryDiscountAmount)
    rows.push({
      key: "dd",
      label: m.amount_delivery_discount(),
      value: m.amount_minus({ amount: money(amounts.deliveryDiscountAmount) }),
    });
  if (amounts.couponDiscountAmount)
    rows.push({
      key: "coupon",
      label: m.amount_coupon(),
      value: m.amount_minus({ amount: money(amounts.couponDiscountAmount) }),
    });
  if (amounts.pointAmount)
    rows.push({
      key: "point",
      label: m.amount_point(),
      value: m.amount_minus({ amount: money(amounts.pointAmount) }),
    });
  return (
    <dl className="tabular flex flex-col border-ink border-t text-body">
      {rows.map((row) => (
        <div key={row.key} className="flex justify-between gap-4 border-line border-b py-3">
          <dt className="text-sub">{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-4 py-4">
        <dt className="font-bold">{m.amount_total()}</dt>
        <dd className="font-bold text-xl">{money(amounts.totalAmount)}</dd>
      </div>
    </dl>
  );
}
