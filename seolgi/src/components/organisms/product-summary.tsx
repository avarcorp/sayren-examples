import type { ProductDetail, StorefrontCoupon } from "@sayren/storefront-sdk";
import { Star } from "lucide-react";
import { formatMoney } from "../../lib/format";
import { Price } from "../atoms/price";
import { CouponLine } from "../molecules/coupon-line";

/** 상세 위쪽 (시안 PdpDesktop) — 「상점 대분류」, 상품명(h1), 평점, 가격, 적립 예정, 쿠폰 줄. 금액은 모두 서버 값이다 */
export function ProductSummary({
  product,
  storeName,
  coupons,
  onDownloadCoupon,
}: {
  product: ProductDetail;
  storeName: string;
  coupons: StorefrontCoupon[];
  onDownloadCoupon: (couponId: string) => Promise<string | null>;
}) {
  const top = product.categoryPath[0]?.name;
  return (
    <div className="flex flex-col">
      <p className="text-small text-muted">{top ? `${storeName} ${top}` : storeName}</p>
      <h1 className="mt-2 font-medium text-h3 leading-snug tracking-[-0.01em]">{product.name}</h1>
      {product.reviewCount > 0 ? (
        <a href="#reviews" className="mt-2.5 flex items-center gap-1.5 self-start py-1 text-small">
          <Star className="size-3.5 fill-ink" aria-hidden />
          {product.averageRating.toFixed(1)}{" "}
          <span className="text-muted">리뷰 {product.reviewCount}</span>
        </a>
      ) : null}
      <div className="mt-6">
        <Price product={product} size="lg" />
      </div>
      {product.purchasePoint ? (
        <p className="mt-2 text-small text-muted">
          구매 시 {formatMoney(product.purchasePoint)} 적립
        </p>
      ) : null}
      {coupons.length > 0 ? (
        <div className="mt-4">
          <CouponLine coupons={coupons} onDownload={onDownloadCoupon} />
        </div>
      ) : null}
    </div>
  );
}
