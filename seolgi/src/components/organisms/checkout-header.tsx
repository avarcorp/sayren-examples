import { Link } from "@tanstack/react-router";
import { BrandMark } from "../atoms/brand-mark";

const STEPS = ["장바구니", "주문서", "주문 완료"] as const;

/** 주문 단계 헤더 (시안 DCart·DCheckout·DComplete) — 로고와 01·02·03 단계. 메뉴를 두지 않는다 */
export function CheckoutHeader({ storeName, step }: { storeName: string; step: 1 | 2 | 3 }) {
  return (
    <header className="border-line border-b">
      <div className="mx-auto flex h-16 max-w-page flex-wrap items-center justify-between gap-6 px-4 md:h-[72px] md:px-10">
        <Link to="/" aria-label={`${storeName} 홈`} className="flex shrink-0 items-center gap-2">
          <BrandMark className="h-7 w-auto text-brand md:h-[34px]" />
          <span className="font-display text-ink text-title md:text-h3">설기로운</span>
        </Link>
        <ol aria-label="주문 단계" className="flex gap-3 text-muted text-small md:gap-5">
          {STEPS.map((label, i) => {
            const on = i + 1 === step;
            return (
              <li
                key={label}
                aria-current={on ? "step" : undefined}
                className={on ? "font-bold text-ink" : ""}
              >
                {String(i + 1).padStart(2, "0")}{" "}
                <span className={on ? "" : "max-sm:sr-only"}>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </header>
  );
}
