import { m } from "../../i18n";

const STEPS = [
  { key: "cart", label: () => m.checkout_step_cart() },
  { key: "checkout", label: () => m.checkout_step_checkout() },
  { key: "complete", label: () => m.checkout_step_complete() },
] as const;

/** 주문 단계 표시 — 01 장바구니 › 02 주문서 › 03 주문 완료. 지금 단계만 잉크 굵게 */
export function CheckoutSteps({ current }: { current: (typeof STEPS)[number]["key"] }) {
  return (
    <ol
      aria-label={m.checkout_steps_label()}
      className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-meta text-muted md:gap-x-3 md:text-body"
    >
      {STEPS.map((step, index) => (
        <li key={step.key} className="flex items-center gap-2 md:gap-3">
          {index > 0 ? <span aria-hidden="true">›</span> : null}
          <span
            aria-current={step.key === current ? "step" : undefined}
            className={step.key === current ? "font-bold text-ink" : undefined}
          >
            {String(index + 1).padStart(2, "0")} {step.label()}
          </span>
        </li>
      ))}
    </ol>
  );
}
