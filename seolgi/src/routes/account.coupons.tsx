import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { buttonClass } from "../components/atoms/button";
import { SectionTitle } from "../components/molecules/section-title";
import { AccountTitle } from "../components/templates/account-template";
import { getCouponsFn } from "../lib/account";
import { benefitText, downloadCouponFn } from "../lib/coupons";
import { formatDate } from "../lib/dates";
import { formatMoney } from "../lib/format";

export const Route = createFileRoute("/account/coupons")({
  loader: () => getCouponsFn(),
  head: () => ({ meta: [{ title: "쿠폰 | 설기로운" }] }),
  component: Coupons,
});

const STATUS: Record<string, string> = {
  AVAILABLE: "사용 가능",
  RESERVED: "결제 중",
  USED: "사용함",
  EXPIRED: "기간 지남",
};

/** 쿠폰 — 받을 수 있는 쿠폰(받기)과 내 쿠폰(상태·기간·조건). 할인은 주문서에서 적용한다 */
function Coupons() {
  const { mine, downloadable } = Route.useLoaderData();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const available = mine.filter((c) => c.status === "AVAILABLE").length;
  return (
    <>
      <AccountTitle title="쿠폰" aside={`사용 가능 ${available}장`} />
      {message ? (
        <p role="status" className="border border-ink px-4 py-3 text-body">
          {message}
        </p>
      ) : null}
      {downloadable.length > 0 ? (
        <section aria-labelledby="dl-title" className="flex flex-col">
          <SectionTitle id="dl-title" title="받을 수 있는 쿠폰" />
          {downloadable.map((c) => (
            <div
              key={c.couponId}
              className="flex items-center justify-between gap-4 border-line border-b py-5"
            >
              <span className="flex min-w-0 flex-col gap-1 text-body">
                <span className="font-bold text-title text-primary">{benefitText(c.benefit)}</span>
                <span>{c.name}</span>
                <span className="text-caption text-muted">
                  {c.minOrderAmount
                    ? `${formatMoney(c.minOrderAmount)} 이상 주문`
                    : "금액 조건 없음"}
                  {c.endsAt ? ` · ${formatDate(c.endsAt)}까지 받기` : ""}
                </span>
              </span>
              <button
                type="button"
                className={buttonClass({ variant: "outline", size: "sm" })}
                onClick={async () => {
                  const r = await downloadCouponFn({ data: { couponId: c.couponId } });
                  setMessage("error" in r ? r.error : "쿠폰을 받았습니다.");
                  await router.invalidate();
                }}
              >
                받기
              </button>
            </div>
          ))}
        </section>
      ) : null}
      <section aria-labelledby="mine-title" className="flex flex-col">
        <SectionTitle id="mine-title" title="내 쿠폰" />
        {mine.length === 0 ? (
          <p className="py-16 text-center text-muted">가진 쿠폰이 없습니다.</p>
        ) : (
          mine.map((c) => {
            const on = c.status === "AVAILABLE";
            return (
              <div
                key={c.issueId}
                className={`flex flex-col gap-1 border-line border-b py-5 text-body ${on ? "" : "text-muted"}`}
              >
                <span className={`font-bold text-title ${on ? "text-primary" : ""}`}>
                  {benefitText(c.benefit)}
                </span>
                <span>
                  {c.name} <span className="text-caption">· {STATUS[c.status] ?? c.status}</span>
                </span>
                <span className="text-caption text-muted">
                  {c.minOrderAmount
                    ? `${formatMoney(c.minOrderAmount)} 이상 주문`
                    : "금액 조건 없음"}
                  {c.validUntil ? ` · ${formatDate(c.validUntil)}까지` : ""}
                </span>
              </div>
            );
          })
        )}
      </section>
    </>
  );
}
