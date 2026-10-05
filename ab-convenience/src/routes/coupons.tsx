import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { z } from "zod";
import { couponBenefitText } from "../components/coupon-benefit";
import { CouponDownloadList } from "../components/coupon-download-list";
import { CouponTicket } from "../components/mypage/coupon-ticket";
import { MyPageShell } from "../components/mypage/my-page-shell";
import { TAB_ROW, tabClass } from "../components/mypage/pagination";
import { buttonClass } from "../components/ui/button";
import { EmptyState, PageTitle, SectionHeader } from "../components/ui/section";
import { m } from "../i18n";
import { getDownloadableCoupons } from "../lib/coupon-download";
import { formatDateTime, formatPrice } from "../lib/format";
import { getMyCoupons, MY_COUPON_STATUSES, type MyCouponStatus } from "../lib/my-coupons";
import { pageTitle } from "../lib/page-title";
import { COUPON_PROMOTIONS } from "../site/promotions";

const couponsSearch = z.object({
  /** 보유 쿠폰 거르기 — 없으면 사용 가능 */
  status: z.enum(["used", "expired"]).optional().catch(undefined),
});

/** 쿠폰 — 진행 중인 코드 쿠폰 안내(누구나), 보유 쿠폰(회원, 상태별), 사용 방법 */
export const Route = createFileRoute("/coupons")({
  validateSearch: couponsSearch,
  loaderDeps: ({ search }) => ({ status: search.status ?? ("available" as const) }),
  loader: async ({ deps }) => {
    const [mine, downloadable] = await Promise.all([
      getMyCoupons({ data: { status: deps.status } }),
      getDownloadableCoupons(),
    ]);
    return { ...mine, downloadable: downloadable.coupons };
  },
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, m.coupons_title()) }] }),
  component: Coupons,
});

const STATUS_LABEL: Record<MyCouponStatus, () => string> = {
  available: () => m.mypage_coupon_status_available(),
  used: () => m.mypage_coupon_status_used(),
  expired: () => m.mypage_coupon_status_expired(),
};

const EMPTY_LABEL: Record<MyCouponStatus, () => string> = {
  available: () => m.coupons_mine_empty(),
  used: () => m.mypage_coupon_mine_empty_used(),
  expired: () => m.mypage_coupon_mine_empty_expired(),
};

function Coupons() {
  const { loggedIn } = Route.useLoaderData();
  const body = (
    <>
      {/* 비회원은 진행 중인 쿠폰 안내가 먼저다 */}
      <DownloadCoupons />
      {loggedIn ? null : <EventCoupons />}
      <MyCoupons />
      {loggedIn ? <EventCoupons /> : null}
      <section aria-labelledby="coupons-how" className="flex min-w-0 flex-col gap-4">
        <SectionHeader id="coupons-how" title={m.coupons_how_title()} rule />
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-body text-sub">
          <li>{m.coupons_how_1()}</li>
          <li>{m.coupons_how_2()}</li>
          <li>{m.coupons_how_3()}</li>
        </ol>
      </section>
    </>
  );
  // 비회원도 진행 중인 쿠폰 안내는 본다 — 마이페이지 메뉴 없이 그린다
  if (!loggedIn) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-8 md:py-4">
        <PageTitle>{m.coupons_title()}</PageTitle>
        {body}
      </div>
    );
  }
  return (
    <MyPageShell current="coupons" title={m.coupons_title()}>
      {body}
    </MyPageShell>
  );
}

/** 받을 수 있는 쿠폰(#110) — 받으면 보유 쿠폰 목록을 다시 받는다. 받을 쿠폰이 없으면 섹션을 그리지 않는다 */
function DownloadCoupons() {
  const { loggedIn, downloadable } = Route.useLoaderData();
  const router = useRouter();
  if (downloadable.length === 0) return null;
  return (
    <section aria-labelledby="coupons-download" className="flex min-w-0 flex-col gap-4">
      <SectionHeader id="coupons-download" title={m.coupon_download_section()} rule />
      <CouponDownloadList
        coupons={downloadable}
        loggedIn={loggedIn}
        onDownloaded={() => void router.invalidate()}
      />
    </section>
  );
}

function MyCoupons() {
  const { loggedIn, coupons } = Route.useLoaderData();
  const { status = "available" } = Route.useSearch();
  let content: ReactNode;
  if (!loggedIn) {
    content = (
      <div className="flex flex-wrap items-center justify-between gap-3 bg-chip p-4 text-body md:p-5">
        <p>{m.coupons_mine_login()}</p>
        <Link
          to="/login"
          search={{ redirectTo: "/coupons" }}
          className={buttonClass({ variant: "primary", size: "sm" })}
        >
          {m.coupons_login()}
        </Link>
      </div>
    );
  } else if (coupons.length === 0) {
    content = <EmptyState title={EMPTY_LABEL[status]()} />;
  } else {
    content = (
      <ul className="grid min-w-0 gap-3 md:grid-cols-2">
        {coupons.map((coupon) => (
          <li key={coupon.issueId} className="min-w-0">
            <CouponTicket
              dimmed={status !== "available"}
              benefit={couponBenefitText(coupon.benefit)}
              name={coupon.name}
              conditions={[
                coupon.minOrderAmount > 0
                  ? m.coupons_min_order({ amount: formatPrice(coupon.minOrderAmount) })
                  : null,
                coupon.validUntil
                  ? m.coupons_valid_until({ date: formatDateTime(coupon.validUntil) })
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              stub={STATUS_LABEL[status]()}
            />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <section aria-labelledby="coupons-mine" className="flex min-w-0 flex-col gap-4">
      <SectionHeader id="coupons-mine" title={m.coupons_mine_title()} rule={!loggedIn} />
      {loggedIn ? (
        <nav aria-label={m.coupons_mine_title()} className={TAB_ROW}>
          {MY_COUPON_STATUSES.map((value) => (
            <Link
              key={value}
              to="/coupons"
              search={{ status: value === "available" ? undefined : value }}
              aria-current={status === value ? "true" : undefined}
              className={tabClass(status === value)}
            >
              {STATUS_LABEL[value]()}
            </Link>
          ))}
        </nav>
      ) : null}
      {content}
    </section>
  );
}

/** 진행 중인 코드 쿠폰 — 상점 안내 콘텐츠(`site/promotions.ts`). 코드는 주문서의 쿠폰 칸에 입력한다 */
function EventCoupons() {
  const [copied, setCopied] = useState<string | null>(null);
  return (
    <section aria-labelledby="coupons-event" className="flex min-w-0 flex-col gap-4">
      <SectionHeader id="coupons-event" title={m.coupons_event_title()} rule />
      <p className="text-meta text-sub">{m.coupons_event_note()}</p>
      <ul className="grid min-w-0 gap-3 md:grid-cols-2">
        {COUPON_PROMOTIONS.map((coupon) => (
          <li key={coupon.code} className="min-w-0">
            <CouponTicket
              benefit={coupon.benefit}
              name={coupon.name}
              conditions={
                <>
                  {coupon.condition} · {coupon.period}
                  <span className="mt-1 block text-ink">
                    {m.coupons_code_label()}{" "}
                    <strong className="break-all font-mono">{coupon.code}</strong>
                  </span>
                </>
              }
              stub={
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(coupon.code)
                      .then(() => setCopied(coupon.code))
                      .catch(() => setCopied(null));
                  }}
                  className={buttonClass({ variant: "subtle", size: "xs" })}
                >
                  {m.coupons_copy()}
                </button>
              }
            />
          </li>
        ))}
      </ul>
      {copied ? (
        <p role="status" className="text-body">
          {m.coupons_copied()}
        </p>
      ) : null}
    </section>
  );
}
