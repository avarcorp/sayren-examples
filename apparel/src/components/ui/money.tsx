import type { ReactNode } from "react";
import { formatMoney } from "../../lib/format";

/** 금액 줄 — 라벨과 서버가 준 금액. 합계 줄은 굵게 */
export function MoneyRow({
  label,
  amount,
  currency,
  strong = false,
  sign = "",
}: {
  label: ReactNode;
  amount: number;
  currency?: string;
  strong?: boolean;
  sign?: "" | "-";
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${strong ? "font-semibold text-body-lg" : "text-body text-sub"}`}
    >
      <dt>{label}</dt>
      <dd className="tabular shrink-0 text-ink">
        {sign}
        {formatMoney(amount, currency)}
      </dd>
    </div>
  );
}

/** 금액 상자 — 테두리만 있는 흰 상자 */
export function SummaryBox({ children }: { children: ReactNode }) {
  return <dl className="flex flex-col gap-2.5 border border-line p-4">{children}</dl>;
}
