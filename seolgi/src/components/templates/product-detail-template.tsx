import type { ProductDetail, PublicInquiry, StorefrontCoupon } from "@sayren/storefront-sdk";
import type { ReactNode } from "react";
import type { Tone } from "../../lib/tones";
import { Breadcrumb } from "../molecules/breadcrumb";
import { Gallery } from "../organisms/gallery";
import { Inquiries } from "../organisms/inquiries";
import { ProductDescription } from "../organisms/product-description";
import { DeliveryReturnInfo, ProductInfo } from "../organisms/product-info";
import { ProductSummary } from "../organisms/product-summary";
import { ProductTabs } from "../organisms/product-tabs";

export interface ProductDetailTemplateProps {
  product: ProductDetail;
  storeName: string;
  tone: Tone;
  coupons: StorefrontCoupon[];
  onDownloadCoupon: (couponId: string) => Promise<string | null>;
  /** 데스크톱 구매 영역(BuyPanel) */
  buyPanel: ReactNode;
  /** 모바일 하단 막대와 옵션 시트 */
  mobileBuy: ReactNode;
  /** 리뷰 구역(Reviews) */
  reviews: ReactNode;
  reviewCount: number;
  inquiries: {
    data: { contents: PublicInquiry[]; totalElements: number } | null;
    loggedIn: boolean;
    loginRedirect: string;
    onSubmit: (input: { content: string; secret: boolean }) => Promise<string | null>;
  };
}

/** 상품 상세 (시안 PdpDesktop·PdpDetail·PdpMobile) — 위치, 사진 슬라이드, 요약·구매, 탭, 상세·리뷰·문의·배송 */
export function ProductDetailTemplate({
  product,
  storeName,
  tone,
  coupons,
  onDownloadCoupon,
  buyPanel,
  mobileBuy,
  reviews,
  reviewCount,
  inquiries,
}: ProductDetailTemplateProps) {
  return (
    <div className="pt-5 pb-28 md:pb-10">
      <Breadcrumb path={product.categoryPath} />
      <div className="flex flex-wrap items-start gap-10 md:gap-14">
        <div className="-mx-4 min-w-0 flex-[999_1_640px] md:mx-0">
          <Gallery
            name={product.name}
            images={product.images}
            tone={tone}
            label={product.categoryPath[0]?.name ?? null}
          />
        </div>
        <div className="flex min-w-0 max-w-[460px] flex-[1_1_400px] flex-col gap-7">
          <ProductSummary
            product={product}
            storeName={storeName}
            coupons={coupons}
            onDownloadCoupon={onDownloadCoupon}
          />
          <div className="hidden md:block">{buyPanel}</div>
        </div>
      </div>

      <div className="mt-20">
        <ProductTabs
          tabs={[
            { id: "detail", label: "상세 정보" },
            { id: "reviews", label: "리뷰", count: reviewCount },
            { id: "qna", label: "문의", count: inquiries.data?.totalElements },
            { id: "delivery", label: "배송·교환·반품" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-24 pt-16">
        <section
          id="detail"
          aria-labelledby="detail-title"
          className="mx-auto flex w-full max-w-[860px] scroll-mt-20 flex-col gap-12"
        >
          {/* 탭 바가 이름을 보이므로 제목은 화면에서 숨긴다(제목 순서용) */}
          <h2 id="detail-title" className="sr-only">
            상세 정보
          </h2>
          <ProductDescription description={product.description} />
          <ProductInfo product={product} />
        </section>
        <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-20">
          {reviews}
        </section>
        <section
          id="qna"
          aria-labelledby="qna-title"
          className="mx-auto w-full max-w-[860px] scroll-mt-20"
        >
          <Inquiries storeName={storeName} {...inquiries} />
        </section>
        <section
          id="delivery"
          aria-labelledby="delivery-title"
          className="mx-auto flex w-full max-w-[860px] scroll-mt-20 flex-col gap-6"
        >
          <h2 id="delivery-title" className="font-medium text-title">
            배송·교환·반품
          </h2>
          <DeliveryReturnInfo product={product} />
        </section>
      </div>
      {mobileBuy}
    </div>
  );
}
