import type { ReactNode } from "react";

export interface SummaryRow {
  label: string;
  value: ReactNode;
  /** 할인 줄 — primary 글자 */
  accent?: boolean;
}

/** 금액 요약 — 잉크 윗선 아래 이름·금액 줄, 그 아래 큰 합계. 금액은 서버 값을 그대로 받는다 */
export function SummaryRows({
  rows,
  totalLabel,
  total,
}: {
  rows: SummaryRow[];
  totalLabel: string;
  total: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-y-3 border-ink border-t pt-5 text-body">
        {rows.map((r) => (
          <div key={r.label} className="contents">
            <dt className="text-muted">{r.label}</dt>
            <dd className={`text-right ${r.accent ? "text-primary" : ""}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="flex items-baseline justify-between border-line border-t pt-4">
        <span className="font-medium text-lead">{totalLabel}</span>
        <span className="font-bold text-h3">{total}</span>
      </p>
    </div>
  );
}
