import { useEffect, useState } from "react";
import type { CheckoutState } from "../../hooks/use-checkout";
import { benefitText } from "../../lib/coupons";
import { formatMoney } from "../../lib/format";
import { inputClass } from "../atoms/text-input";
import { SectionTitle } from "../molecules/section-title";

const subtle =
  "h-10 shrink-0 border border-line-strong bg-page px-3.5 text-small hover:border-ink disabled:opacity-40";

/**
 * 할인 (시안 DCheckout) — 쿠폰 줄(적용한 쿠폰 · 「쿠폰 변경 · n장」)과 적립금 줄(금액 칸 · 「전액 사용」).
 * 할인액·사용액은 서버 미리보기 값이다. 비회원은 쿠폰 코드만 입력한다.
 */
export function CheckoutDiscounts({ state }: { state: CheckoutState }) {
  const { coupon, points, busy } = state;
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  // 입력 중일 때만 글자를 들고 있고, 아니면 서버가 정한 사용액을 보인다
  const [pointDraft, setPointDraft] = useState<string | null>(null);
  const commitPoints = () => {
    if (pointDraft === null) return;
    const amount = Number(pointDraft.replaceAll(",", "")) || 0;
    setPointDraft(null);
    if (amount !== points.applied) void points.apply(amount);
  };
  const usable = coupon.available.filter((c) => c.applicable);
  // 쿠폰이 적용되면 고르는 칸을 닫는다
  useEffect(() => {
    if (coupon.applied) setOpen(false);
  }, [coupon.applied]);
  return (
    <section aria-labelledby="discount-title" className="flex flex-col gap-5">
      <SectionTitle id="discount-title" title="할인" />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-body">
        <span className="w-20 text-muted">쿠폰</span>
        <span className="min-w-0 flex-1">
          {coupon.applied ? (
            <>
              {coupon.applied.name}{" "}
              <span className="text-primary">−{formatMoney(coupon.applied.discountAmount)}</span>
            </>
          ) : (
            <span className="text-muted">적용 안 함</span>
          )}
        </span>
        {coupon.applied ? (
          <button
            type="button"
            className={subtle}
            disabled={busy}
            onClick={() => void coupon.remove()}
          >
            해제
          </button>
        ) : null}
        <button
          type="button"
          className={subtle}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          쿠폰 {coupon.applied ? "변경" : "선택"}
          {usable.length ? ` · ${usable.length}장` : ""}
        </button>
      </div>
      {open ? (
        <div className="flex flex-col gap-3 border-line border-y py-3 md:ml-24">
          {coupon.available.length > 0 ? (
            <ul className="flex flex-col">
              {coupon.available.map((c) => (
                <li
                  key={c.issueId}
                  className="flex items-center justify-between gap-3 py-2 text-small"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className={c.applicable ? "font-medium" : "text-muted"}>
                      {c.name} · {benefitText(c.benefit)}
                    </span>
                    <span className="text-caption text-muted">
                      {c.applicable
                        ? `예상 할인 ${formatMoney(c.expectedDiscountAmount)}`
                        : c.minOrderAmount
                          ? `${formatMoney(c.minOrderAmount)} 이상 주문`
                          : "이 주문에 쓸 수 없음"}
                    </span>
                  </span>
                  <button
                    type="button"
                    className={subtle}
                    disabled={!c.applicable || busy}
                    onClick={async () => {
                      await coupon.apply({ issueId: c.issueId });
                      setOpen(false);
                    }}
                  >
                    적용
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex items-end gap-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                // 주문서 form 안이라 Enter로 결제를 시작하지 않고 코드를 적용한다
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (code.trim().length >= 6) void coupon.apply({ code: code.trim() });
                }
              }}
              aria-label="쿠폰 코드"
              placeholder="쿠폰 코드 입력"
              pattern="[A-Za-z0-9_\-]{6,30}"
              className={inputClass}
            />
            <button
              type="button"
              className={subtle}
              disabled={busy || code.trim().length < 6}
              onClick={() => void coupon.apply({ code: code.trim() })}
            >
              코드 적용
            </button>
          </div>
        </div>
      ) : null}
      {coupon.error ? (
        <p role="alert" className="text-primary text-small md:ml-24">
          {coupon.error}
        </p>
      ) : null}

      {points.info ? (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-body">
            <label htmlFor="point-amount" className="w-20 text-muted">
              적립금
            </label>
            <input
              id="point-amount"
              inputMode="numeric"
              value={pointDraft ?? (points.applied ? points.applied.toLocaleString("ko-KR") : "")}
              onFocus={() => setPointDraft(points.applied ? String(points.applied) : "")}
              onChange={(e) => setPointDraft(e.target.value.replace(/[^0-9,]/g, ""))}
              onBlur={commitPoints}
              onKeyDown={(e) => {
                // 주문서 form 안이라 Enter로 결제하지 않고 적립금만 적용한다
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              placeholder="0"
              className={`${inputClass} h-10 flex-1 text-right`}
            />
            <button
              type="button"
              className={subtle}
              disabled={busy || points.info.maxUsable < points.info.minAmount}
              onClick={() => {
                setPointDraft(null);
                void points.apply(points.info?.maxUsable ?? 0);
              }}
            >
              전액 사용 · {formatMoney(points.info.maxUsable)}
            </button>
          </div>
          <p className="-mt-3 text-caption text-muted md:ml-24">
            보유 {formatMoney(points.info.balance)} · {formatMoney(points.info.minAmount)}부터{" "}
            {points.info.unit}원 단위로 사용합니다
          </p>
          {points.error ? (
            <p role="alert" className="-mt-3 text-primary text-small md:ml-24">
              {points.error}
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
