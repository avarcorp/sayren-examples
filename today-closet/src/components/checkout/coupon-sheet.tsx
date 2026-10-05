import type { ApplicableCoupon } from "@sayren/storefront-sdk";
import { type ReactNode, useEffect, useState } from "react";
import { m } from "../../i18n";
import type { AppliedCoupon } from "../../lib/coupon-code";
import { couponRejectMessage } from "../../lib/coupon-code";
import { formatDateTime, formatPrice } from "../../lib/format";
import { couponBenefitText } from "../coupon-benefit";
import { buttonClass, inputClass } from "../ui/button";
import { Sheet } from "../ui/sheet";

const NONE = "none";

/**
 * 쿠폰 선택 시트 — 보유 쿠폰을 티켓으로 보이고(이 주문의 예상 할인액은 서버 값), 「쿠폰 사용 안 함」, 아래 쿠폰 코드 입력.
 * 적용은 화면의 미리보기(`onApplyIssue`·`onApplyCode`)가 한다. 성공하면 시트를 닫는다.
 */
export function CouponSheet({
  open,
  onClose,
  coupons,
  applied,
  busy,
  error,
  onApplyIssue,
  onApplyCode,
  onRemove,
  downloadable,
}: {
  open: boolean;
  onClose: () => void;
  coupons: ApplicableCoupon[];
  applied: AppliedCoupon | null;
  busy: boolean;
  error: string | null;
  onApplyIssue: (issueId: string) => Promise<boolean>;
  onApplyCode: (code: string) => Promise<boolean>;
  onRemove: () => void;
  /** 받을 수 있는 쿠폰(#110) — 보유 쿠폰 아래에 그린다. 받으면 화면이 보유 목록을 다시 받는다 */
  downloadable?: ReactNode;
}) {
  const [choice, setChoice] = useState<string>(NONE);
  const [code, setCode] = useState("");
  // 열 때마다 지금 적용한 쿠폰을 고른 상태로 시작한다
  useEffect(() => {
    if (!open) return;
    setChoice(applied?.issueId ?? NONE);
    setCode(applied?.code ?? "");
  }, [open, applied]);

  const usable = coupons.filter((coupon) => coupon.applicable).length;
  const picked = coupons.find((coupon) => coupon.issueId === choice) ?? null;

  const confirm = () => {
    if (!picked) {
      if (applied) onRemove();
      onClose();
      return;
    }
    if (applied?.issueId === picked.issueId) {
      onClose();
      return;
    }
    void onApplyIssue(picked.issueId).then((ok) => {
      if (ok) onClose();
    });
  };

  const register = () => {
    void onApplyCode(code.trim()).then((ok) => {
      if (ok) onClose();
    });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={m.checkout_coupon_select()}
      closeLabel={m.checkout_coupon_sheet_close()}
      footer={
        <button
          type="button"
          disabled={busy}
          onClick={confirm}
          className={buttonClass({ variant: "primary", size: "md", block: true })}
        >
          {picked
            ? m.checkout_coupon_apply_amount({ amount: formatPrice(picked.expectedDiscountAmount) })
            : m.checkout_coupon_confirm()}
        </button>
      }
    >
      <div className="flex flex-col gap-2.5">
        <p className="text-meta text-sub">
          {coupons.length
            ? m.checkout_coupon_sheet_summary({ total: coupons.length, usable })
            : m.checkout_coupon_sheet_none()}
        </p>
        <fieldset className="flex min-w-0 flex-col gap-2.5">
          <legend className="sr-only">{m.checkout_coupon_select()}</legend>
          {coupons.map((coupon) => (
            <CouponTicket
              key={coupon.issueId}
              coupon={coupon}
              checked={choice === coupon.issueId}
              onChange={() => setChoice(coupon.issueId)}
            />
          ))}
          <label className="flex cursor-pointer items-center gap-2.5 border-line border-b py-3.5 text-body">
            <input
              type="radio"
              name="couponChoice"
              checked={choice === NONE}
              onChange={() => setChoice(NONE)}
              className="size-5 shrink-0 accent-ink"
            />
            {m.checkout_coupon_none()}
          </label>
        </fieldset>
        {downloadable ? (
          <section className="flex flex-col gap-2.5 pt-3">
            <h3 className="font-bold text-body">{m.coupon_download_section()}</h3>
            {downloadable}
          </section>
        ) : null}
        <div className="flex flex-col gap-2 pt-1.5">
          <label htmlFor="coupon-sheet-code" className="font-medium text-meta">
            {m.checkout_coupon_code()}
          </label>
          <div className="flex gap-2">
            <input
              id="coupon-sheet-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                register();
              }}
              placeholder={m.checkout_coupon_code_placeholder()}
              autoComplete="off"
              className={inputClass({ className: "uppercase placeholder:normal-case" })}
            />
            <button
              type="button"
              disabled={busy}
              onClick={register}
              className={buttonClass({ variant: "outline", size: "md", className: "font-medium" })}
            >
              {m.checkout_coupon_register()}
            </button>
          </div>
        </div>
        {error ? (
          <p role="alert" className="text-caption text-point">
            {error}
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}

/** 쿠폰 티켓 — 왼쪽 혜택·이름·조건, 점선 너머 오른쪽 선택. 이 주문에 쓸 수 없으면 사유와 함께 비활성 */
function CouponTicket({
  coupon,
  checked,
  onChange,
}: {
  coupon: ApplicableCoupon;
  checked: boolean;
  onChange: () => void;
}) {
  const disabled = !coupon.applicable;
  const conditions = [
    coupon.minOrderAmount > 0
      ? m.checkout_coupon_min_order({ amount: formatPrice(coupon.minOrderAmount) })
      : null,
    coupon.validUntil
      ? m.checkout_coupon_valid_until({ date: formatDateTime(coupon.validUntil) })
      : null,
  ].filter(Boolean);
  return (
    <label
      className={`flex min-w-0 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-ink has-[input:focus-visible]:outline-offset-2 ${
        disabled
          ? "cursor-not-allowed border border-line text-muted"
          : checked
            ? "cursor-pointer border-[1.5px] border-ink"
            : "cursor-pointer border border-line-strong"
      }`}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1 p-4">
        <b className="break-words text-xl">{couponBenefitText(coupon.benefit)}</b>
        <span className="break-words text-body">{coupon.name}</span>
        {conditions.length ? (
          <span className={`text-caption ${disabled ? "" : "text-muted"}`}>
            {conditions.join(" · ")}
          </span>
        ) : null}
        <span className={`text-caption ${disabled ? "" : "font-bold text-point"}`}>
          {disabled
            ? couponRejectMessage(coupon.rejectReason)
            : m.checkout_my_coupon_expected({ amount: formatPrice(coupon.expectedDiscountAmount) })}
        </span>
      </span>
      <span
        className={`flex w-16 shrink-0 items-center justify-center border-l border-dashed ${
          disabled ? "border-line" : "border-line-strong"
        }`}
      >
        <input
          type="radio"
          name="couponChoice"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          aria-label={coupon.name}
          className="size-5 shrink-0 accent-ink"
        />
      </span>
    </label>
  );
}
