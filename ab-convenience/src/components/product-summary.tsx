import type { ProductDetail } from "@sayren/storefront-sdk";
import { ChevronRight, Download, Star, Ticket } from "lucide-react";
import { type ReactNode, useState } from "react";
import { m } from "../i18n";
import { formatPrice } from "../lib/format";
import { priceView } from "../lib/price";
import { CouponDownloadSheet } from "./coupon-download-list";
import { deliverySummaryOf } from "./product-buy-box";
import { localMethodsOf, methodsLabelOf } from "./product-purchase";
import { Badge } from "./ui/badge";
import { Price } from "./ui/price";

/**
 * 상단 구매 영역의 정보 — 배지(데이터 있을 때) → 상품명 → 별점·리뷰 수 → 가격 블록 → 정보 행(배송·혜택·적립·교환/반품).
 * 정보 행은 상품 데이터·상점 운영 규칙(당일 출고)·보유 쿠폰 수만 쓴다. 카드 혜택처럼 없는 사실은 적지 않는다.
 * 모바일은 가격 아래 보유 쿠폰 줄, 8px 띠 뒤에 배송·교환/반품이다(혜택 행의 쿠폰은 위 줄로 옮긴다).
 */
export function ProductSummary({
  product,
  onJump,
  myCouponCount = null,
  downloadableCouponCount = 0,
}: {
  product: ProductDetail;
  /** 회원의 쓸 수 있는 보유 쿠폰 수(서버 값). 비회원이면 null */
  myCouponCount?: number | null;
  /** 이 상품에 쓸 수 있고 아직 받지 않은 받기 쿠폰 수(#110) */
  downloadableCouponCount?: number;
  /** 「자세히 보기」·리뷰 수 — 아래 섹션으로 옮겨 간다 */
  onJump: (section: "reviews" | "shipping") => void;
}) {
  const view = priceView(product);
  const rating = product.averageRating.toFixed(1);
  const shipping = product.fulfillment.type === "SHIPPING" ? product.fulfillment.shipping : null;
  const localMethods = localMethodsOf(product.fulfillment);
  const threshold =
    shipping?.deliveryType === "CONDITIONAL_FREE" ? shipping.conditionalFreeAmount : null;
  const alwaysFree = shipping
    ? shipping.deliveryType === "FREE" || shipping.deliveryFee === 0
    : false;
  const freeBadge = product.freeShipping || alwaysFree;
  const [couponSheet, setCouponSheet] = useState(false);
  const couponText =
    downloadableCouponCount > 0
      ? m.pd_info_coupon_downloadable({ count: downloadableCouponCount })
      : myCouponCount
        ? m.pd_info_coupon_mine({ count: myCouponCount })
        : m.pd_info_coupon_value();

  return (
    <div className="flex min-w-0 flex-col gap-5 md:gap-6">
      <div className="flex flex-col gap-2.5">
        {freeBadge || product.soldOut ? (
          <div className="flex flex-wrap gap-1.5">
            {product.soldOut ? <Badge tone="muted">{m.pd_badge_sold_out()}</Badge> : null}
            {freeBadge ? <Badge tone="neutral">{m.pd_free_delivery()}</Badge> : null}
          </div>
        ) : null}
        <h1 className="break-words font-bold text-lg leading-snug tracking-tight md:text-[1.375rem]">
          {product.name}
        </h1>
        {product.reviewCount > 0 ? (
          <button
            type="button"
            onClick={() => onJump("reviews")}
            className="flex w-fit items-center gap-1 text-meta hover:text-sub"
          >
            <span className="sr-only">
              {m.pd_rating_label({ rating, count: product.reviewCount })}
            </span>
            <Star aria-hidden="true" className="size-3.5 fill-ink text-ink" strokeWidth={1.6} />
            <b aria-hidden="true">{rating}</b>
            <span aria-hidden="true" className="text-muted underline underline-offset-2">
              {m.pd_review_count({ count: product.reviewCount })}
            </span>
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 md:border-line md:border-b md:pb-6">
        <div>
          <span className="sr-only">{m.pd_price_label()}</span>
          <Price view={view} size="lg" />
        </div>
        {/* 모바일 — 보유 쿠폰 줄(잉크 테두리 44px) */}
        <button
          type="button"
          onClick={() => setCouponSheet(true)}
          className="flex h-11 items-center justify-between gap-2 border border-ink px-3.5 font-bold text-meta md:hidden"
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <Ticket aria-hidden="true" className="size-[1.125rem] shrink-0" strokeWidth={1.6} />
            <span className="truncate">{couponText}</span>
          </span>
          <span className="flex shrink-0 items-center gap-0.5">
            {downloadableCouponCount > 0 ? m.coupon_download_button() : null}
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.6} />
          </span>
        </button>
      </div>

      {/* 모바일 섹션 띠 */}
      <div aria-hidden="true" className="-mx-4 h-2 bg-chip md:hidden" />

      <dl className="flex flex-col gap-2.5 text-meta md:gap-3 md:border-line md:border-b md:pb-6 md:text-body">
        <InfoRow label={m.pd_info_delivery()}>
          <p>{deliverySummaryOf(product.fulfillment)}</p>
          {localMethods ? (
            <>
              <p className="text-sub">{methodsLabelOf(localMethods)}</p>
              <p className="text-sub">{m.pd_info_local_prepare()}</p>
            </>
          ) : (
            <>
              {shipping?.estimatedDays ? (
                <p className="text-sub">
                  {m.pd_info_delivery_days({ days: shipping.estimatedDays })}
                </p>
              ) : null}
              {shipping ? <p className="text-sub">{m.pd_info_delivery_dispatch()}</p> : null}
            </>
          )}
          <button
            type="button"
            onClick={() => onJump("shipping")}
            className="mt-0.5 flex items-center text-meta text-muted underline underline-offset-2 hover:text-ink"
          >
            {m.pd_info_more()}
          </button>
        </InfoRow>
        <InfoRow label={m.pd_info_benefit()} className="max-md:hidden">
          {threshold || alwaysFree ? (
            <p>
              {threshold
                ? m.pd_info_benefit_free({ threshold: formatPrice(threshold) })
                : m.pd_info_benefit_always_free()}
            </p>
          ) : null}
          <p className="flex items-baseline justify-between gap-2">
            <span className="min-w-0">{couponText}</span>
            <button
              type="button"
              onClick={() => setCouponSheet(true)}
              className="flex h-8 shrink-0 items-center gap-1 border border-ink px-2.5 font-bold text-caption hover:bg-chip"
            >
              <Download aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
              {m.coupon_download_button()}
            </button>
          </p>
        </InfoRow>
        {threshold || alwaysFree ? (
          <InfoRow label={m.pd_info_benefit()} className="md:hidden">
            {threshold
              ? m.pd_info_benefit_free({ threshold: formatPrice(threshold) })
              : m.pd_info_benefit_always_free()}
          </InfoRow>
        ) : null}
        {product.purchasePoint ? (
          <InfoRow label={m.pd_info_point()}>
            {m.product_purchase_point({ amount: formatPrice(product.purchasePoint) })}
          </InfoRow>
        ) : null}
        <InfoRow label={m.pd_info_returns()}>
          {m.pd_info_returns_value({ days: product.returnPeriodDays })}
        </InfoRow>
      </dl>
      <CouponDownloadSheet
        open={couponSheet}
        onClose={() => setCouponSheet(false)}
        productId={product.productId}
      />
    </div>
  );
}

/** 정보 한 행 — 라벨 열 고정(모바일 64·데스크톱 88), 값 열은 줄바꿈 허용 */
function InfoRow({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-[4rem_minmax(0,1fr)] gap-2 leading-relaxed md:grid-cols-[5.5rem_minmax(0,1fr)] md:gap-3 ${className}`}
    >
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
