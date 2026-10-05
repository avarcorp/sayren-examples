import { formatPrice } from "../../lib/format";
import type { PriceView } from "../../lib/price";

/**
 * 가격 원자 — 할인율만 포인트 색이고 판매가는 늘 잉크다. 두 숫자를 같은 색으로 두면 한 덩어리로 읽힌다.
 *
 * - lg(상세): 정가 취소선이 위 줄, 아래 줄에 할인율·판매가 28px
 * - md(카드): 할인율·판매가 15px, 정가는 아래 줄 12px
 * - sm(목록 줄·요약): 한 줄
 */
export function Price({
  view,
  size = "md",
  className = "",
}: {
  view: PriceView;
  size?: "lg" | "md" | "sm";
  className?: string;
}) {
  const { price, compareAt, rate } = view;
  if (size === "lg") {
    return (
      <div className={`flex flex-col gap-0.5 ${className}`}>
        {compareAt != null ? (
          <s className="tabular text-body text-muted">{formatPrice(compareAt)}</s>
        ) : null}
        <p className="flex items-baseline gap-2 font-bold text-2xl tracking-tight md:text-[1.75rem]">
          {rate ? <span className="text-point">{rate}%</span> : null}
          <span className="tabular text-ink">{formatPrice(price)}</span>
        </p>
      </div>
    );
  }
  if (size === "sm") {
    return (
      <span className={`inline-flex flex-wrap items-baseline gap-x-1.5 ${className}`}>
        {rate ? <span className="font-bold text-point">{rate}%</span> : null}
        <span className="tabular font-bold">{formatPrice(price)}</span>
        {compareAt != null ? (
          <s className="tabular text-caption text-muted">{formatPrice(compareAt)}</s>
        ) : null}
      </span>
    );
  }
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="flex items-baseline gap-1 text-body-lg">
        {rate ? <span className="font-bold text-point">{rate}%</span> : null}
        <span className="tabular font-bold">{formatPrice(price)}</span>
      </span>
      {compareAt != null ? (
        <s className="tabular text-caption text-muted">{formatPrice(compareAt)}</s>
      ) : null}
    </div>
  );
}
