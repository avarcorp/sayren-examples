import { ORDER_STEPS } from "../../lib/order-status";

/** 주문 단계 (시안 DOrder) — 다섯 칸 막대. 지난 단계와 지금 단계는 primary, 지금 단계 이름은 굵게 */
export function OrderSteps({ current }: { current: number }) {
  return (
    <ol aria-label="주문 단계" className="grid grid-cols-5">
      {ORDER_STEPS.map((name, i) => (
        <li
          key={name}
          aria-current={i === current ? "step" : undefined}
          className="flex flex-col gap-2.5 text-small"
        >
          <span aria-hidden className={`block h-0.5 ${i <= current ? "bg-primary" : "bg-line"}`} />
          <span className={i === current ? "font-bold" : i < current ? "text-ink" : "text-muted"}>
            {name}
          </span>
        </li>
      ))}
    </ol>
  );
}
