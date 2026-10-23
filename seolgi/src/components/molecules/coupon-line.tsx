import type { StorefrontCoupon } from "@sayren/storefront-sdk";
import { useState } from "react";
import { benefitText } from "../../lib/coupons";
import { formatMoney } from "../../lib/format";

/**
 * 쿠폰 줄 — 이 상품에 쓰는 받을 수 있는 쿠폰. 금액을 미리 계산하지 않고 혜택만 보인다(최종 할인은 주문서가 정한다).
 * 「쿠폰 받기」를 누르면 쿠폰마다 받기 버튼이 펼쳐진다.
 */
export function CouponLine({
  coupons,
  onDownload,
}: {
  coupons: StorefrontCoupon[];
  onDownload: (couponId: string) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  if (coupons.length === 0) return null;
  const best = coupons[0] as StorefrontCoupon;
  return (
    <div className="border-line border-y">
      <div className="flex items-center justify-between gap-3 text-body">
        <span className="min-w-0 truncate">
          {best.name} <strong className="font-bold">{benefitText(best.benefit)}</strong>
          {coupons.length > 1 ? (
            <span className="text-muted"> 외 {coupons.length - 1}장</span>
          ) : null}
        </span>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="h-11 shrink-0 text-small underline underline-offset-[3px]"
        >
          쿠폰 받기
        </button>
      </div>
      {open ? (
        <ul className="flex flex-col border-line border-t pb-2">
          {coupons.map((c) => {
            const done = c.downloaded === true;
            return (
              <li
                key={c.couponId}
                className="flex items-center justify-between gap-3 py-3 text-small"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium">
                    {c.name} · {benefitText(c.benefit)}
                  </span>
                  <span className="text-caption text-muted">
                    {c.minOrderAmount
                      ? `${formatMoney(c.minOrderAmount)} 이상 주문`
                      : "금액 조건 없음"}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={done || busy === c.couponId}
                  onClick={async () => {
                    setBusy(c.couponId);
                    setMessage(await onDownload(c.couponId));
                    setBusy(null);
                  }}
                  className="h-9 shrink-0 border border-ink px-3 disabled:border-line disabled:text-muted"
                >
                  {done ? "받음" : "받기"}
                </button>
              </li>
            );
          })}
          <li role="status" className="text-caption text-primary empty:hidden">
            {message}
          </li>
        </ul>
      ) : null}
    </div>
  );
}
