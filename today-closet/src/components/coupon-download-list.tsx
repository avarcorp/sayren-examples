import type { StorefrontCoupon } from "@sayren/storefront-sdk";
import { Link, useLocation } from "@tanstack/react-router";
import { Check, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { m } from "../i18n";
import { downloadCoupon, getDownloadableCoupons } from "../lib/coupon-download";
import { formatDateTime, formatPrice } from "../lib/format";
import { couponBenefitText } from "./coupon-benefit";
import { CouponTicket } from "./mypage/coupon-ticket";
import { buttonClass } from "./ui/button";
import { Sheet } from "./ui/sheet";

/** 조건 한 줄 — 최소 주문 금액 · 기한(받은 뒤 N일 또는 종료일) */
function conditionText(coupon: StorefrontCoupon): string {
  const parts: string[] = [];
  parts.push(
    coupon.minOrderAmount > 0
      ? m.coupon_download_min({ amount: formatPrice(coupon.minOrderAmount) })
      : m.coupon_download_no_min(),
  );
  if (coupon.validDaysAfterIssue)
    parts.push(m.coupon_download_days({ days: coupon.validDaysAfterIssue }));
  else if (coupon.endsAt)
    parts.push(m.coupon_download_until({ date: formatDateTime(coupon.endsAt) }));
  return parts.join(" · ");
}

/**
 * 받을 수 있는 쿠폰 목록(#110) — 티켓 오른쪽 칸이 [받기]·「받음」·[로그인]이다. 받으면 그 자리에서 「받음」으로 바뀌고 `onDownloaded`를 부른다
 * (주문서는 보유 쿠폰 목록을 다시 받는다). 받을 쿠폰이 없으면 아무것도 그리지 않는다(`empty`를 주면 그것을 보인다).
 */
export function CouponDownloadList({
  coupons: initial,
  loggedIn,
  onDownloaded,
  empty = null,
}: {
  coupons: StorefrontCoupon[];
  loggedIn: boolean;
  onDownloaded?: (couponId: string) => void;
  empty?: React.ReactNode;
}) {
  const location = useLocation();
  const [coupons, setCoupons] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ couponId: string; text: string } | null>(null);
  useEffect(() => setCoupons(initial), [initial]);

  if (coupons.length === 0) return <>{empty}</>;

  const take = async (couponId: string) => {
    setBusy(couponId);
    setMessage(null);
    const result = await downloadCoupon({ data: { couponId } });
    setBusy(null);
    if (result.ok) {
      setCoupons((list) =>
        list.map((coupon) =>
          coupon.couponId === couponId
            ? { ...coupon, downloaded: true, downloadable: coupon.perMemberIssueLimit > 1 }
            : coupon,
        ),
      );
      setMessage({ couponId, text: m.coupon_download_done() });
      onDownloaded?.(couponId);
      return;
    }
    setMessage({ couponId, text: result.error ?? m.coupon_download_failed() });
  };

  return (
    <ul className="flex flex-col gap-2.5">
      {coupons.map((coupon) => {
        const taken = coupon.downloaded === true && coupon.downloadable !== true;
        return (
          <li key={coupon.couponId} className="flex flex-col gap-1.5">
            <CouponTicket
              dimmed={taken}
              benefit={couponBenefitText(coupon.benefit)}
              name={coupon.name}
              conditions={conditionText(coupon)}
              stub={
                !loggedIn ? (
                  <Link
                    to="/login"
                    search={{ redirectTo: location.href }}
                    className="underline underline-offset-4"
                  >
                    {m.coupon_download_login_short()}
                  </Link>
                ) : taken ? (
                  <span className="flex flex-col items-center gap-1 text-muted">
                    <Check aria-hidden="true" className="size-5" strokeWidth={1.6} />
                    {m.coupon_download_taken()}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busy === coupon.couponId}
                    onClick={() => void take(coupon.couponId)}
                    aria-label={m.coupon_download_aria({ name: coupon.name })}
                    className="flex flex-col items-center gap-1 disabled:opacity-50"
                  >
                    <Download aria-hidden="true" className="size-5" strokeWidth={1.6} />
                    {m.coupon_download_take()}
                  </button>
                )
              }
            />
            {message?.couponId === coupon.couponId ? (
              <p role="status" className="text-caption text-sub">
                {message.text}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * 쿠폰 받기 시트 — 상품 상세의 「쿠폰 받기」. 열 때 그 상품에 쓸 수 있는 쿠폰을 받아 온다.
 */
export function CouponDownloadSheet({
  open,
  onClose,
  productId,
}: {
  open: boolean;
  onClose: () => void;
  productId?: string;
}) {
  const [state, setState] = useState<{ loggedIn: boolean; coupons: StorefrontCoupon[] } | null>(
    null,
  );
  useEffect(() => {
    if (!open) return;
    let alive = true;
    void getDownloadableCoupons({ data: { productId } }).then((result) => {
      if (alive) setState(result);
    });
    return () => {
      alive = false;
    };
  }, [open, productId]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={m.coupon_download_title()}
      closeLabel={m.coupon_download_close()}
      footer={
        <button
          type="button"
          onClick={onClose}
          className={buttonClass({ block: true, size: "lg" })}
        >
          {m.coupon_download_confirm()}
        </button>
      }
    >
      {state ? (
        <CouponDownloadList
          coupons={state.coupons}
          loggedIn={state.loggedIn}
          empty={
            <p className="py-10 text-center text-body text-sub">{m.coupon_download_empty()}</p>
          }
        />
      ) : (
        <p className="py-10 text-center text-body text-muted">{m.coupon_download_loading()}</p>
      )}
    </Sheet>
  );
}
