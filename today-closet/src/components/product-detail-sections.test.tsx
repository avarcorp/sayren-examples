import type { ProductCard, ProductDetail, PublicInquiry } from "@sayren/storefront-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ratingBars } from "../lib/reviews";
import { sellerInfoOf } from "../site/seller";
import { ConfirmDialog } from "./confirm-dialog";
import { FollowingBuyBox } from "./pdp/following-buy-box";
import { ProductDetailTabs } from "./product-detail-tabs";
import { ProductInfoSection } from "./product-info-section";
import { InquiryItem, ProductQna } from "./product-inquiries";
import { ProductReviews } from "./product-reviews";
import { ProductSummary } from "./product-summary";
import { PurchaseProvider } from "./purchase-context";
import { pickRelated } from "./related-products";
import { returnFeeRows, SellerSection } from "./seller-section";

async function render(node: ReactNode): Promise<string> {
  const rootRoute = createRootRoute({ component: () => <>{node}</> });
  const paths = ["/", "/login", "/help", "/privacy", "/account/inquiries", "/products/$productId"];
  const router = createRouter({
    routeTree: rootRoute.addChildren(
      paths.map((path) => createRoute({ getParentRoute: () => rootRoute, path })),
    ),
    history: createMemoryHistory({ initialEntries: ["/"] }),
    isServer: true,
  });
  await router.load();
  return renderToString(<RouterProvider router={router} />);
}

const product = {
  productId: "prod_1",
  name: "레드 플레어 미디 원피스",
  categoryPath: [{ categoryId: "cat_1", name: "원피스" }],
  returnPeriodDays: 7,
  fulfillment: {
    type: "SHIPPING",
    requiresShipping: true,
    shipping: {
      deliveryType: "PAID",
      deliveryFee: 3000,
      conditionalFreeAmount: null,
      estimatedDays: "1~2일",
    },
  },
} as unknown as ProductDetail;

const inquiry = (over: Partial<PublicInquiry>): PublicInquiry => ({
  inquiryId: "q1",
  content: "M 사이즈 총장이 궁금합니다\n자세히 알려 주십시오",
  secret: false,
  mine: false,
  writerMaskedName: "김**",
  answer: null,
  createdAt: "2026-10-01T10:00:00.000Z",
  productId: "prod_1",
  productName: "레드 플레어 미디 원피스",
  thumbnailUrl: null,
  category: "PRODUCT",
  ...over,
});

describe("판매자 정보 헬퍼", () => {
  it("상점 정보 API 값이 먼저이고, 빈 항목만 예시 값으로 채운다", () => {
    expect(sellerInfoOf(null).companyName).toBe("오늘의옷장");
    const fromApi = sellerInfoOf({
      customerCenterPhone: "02-000-0000",
      businessNumber: "1234567890",
      representativeName: "박대표",
      businessName: " ",
    });
    expect(fromApi.phone).toBe("02-000-0000");
    expect(fromApi.businessNumber).toBe("123-45-67890");
    expect(fromApi.ceo).toBe("박대표");
    expect(fromApi.companyName).toBe("오늘의옷장");
    expect(fromApi.mailOrderNumber).toBe(sellerInfoOf(null).mailOrderNumber);
  });
});

describe("리뷰 평점 분포·추천 고르기", () => {
  it("분포는 5점부터 1점까지 비율로, 리뷰가 없으면 0%다", () => {
    expect(ratingBars({ "5": 3, "4": 1 }, 4).map((b) => [b.star, b.percent])).toEqual([
      [5, 75],
      [4, 25],
      [3, 0],
      [2, 0],
      [1, 0],
    ]);
    expect(ratingBars(undefined, 0).every((b) => b.percent === 0)).toBe(true);
  });

  it("추천은 지금 상품·품절을 빼고 10개까지다", () => {
    const card = (id: string, soldOut = false) => ({ productId: id, soldOut }) as ProductCard;
    const list = [
      card("prod_1"),
      card("x", true),
      ...Array.from({ length: 12 }, (_, i) => card(`p${i}`)),
    ];
    const picked = pickRelated(list, "prod_1");
    expect(picked).toHaveLength(10);
    expect(picked.some((p) => p.productId === "prod_1" || p.soldOut)).toBe(false);
  });
});

describe("상세 섹션 마크업", () => {
  it("리뷰가 0건이면 빈 상태를 보인다", async () => {
    const html = await render(
      <ProductReviews
        productId="prod_1"
        initial={{ contents: [], totalElements: 0, totalPages: 0, summary: null, photos: [] }}
      />,
    );
    expect(html).toContain("아직 작성된 리뷰가 없습니다");
  });

  it("리뷰가 있으면 평균·분포·정렬·포토 필터·리뷰 카드(옵션·사진)를 그린다", async () => {
    const html = await render(
      <ProductReviews
        productId="prod_1"
        initial={{
          contents: [
            {
              reviewId: "r1",
              rating: 5,
              content: "핏이 예쁩니다",
              images: ["https://cdn.example.com/r1.jpg"],
              optionName: "레드 / M",
              writerMaskedName: "이**",
              sellerReply: null,
              createdAt: "2026-10-01T10:00:00.000Z",
            },
          ],
          totalElements: 1,
          totalPages: 1,
          summary: { averageRating: 5, totalCount: 1, distribution: { "5": 1 } },
          photos: [],
        }}
      />,
    );
    expect(html).toContain("5.0");
    expect(html).toContain("랭킹순");
    expect(html).toContain("포토 리뷰만");
    expect(html).toContain("옵션 레드 / M");
    expect(html).toContain("https://cdn.example.com/r1.jpg");
  });

  it("Q&A가 없으면 안내와 「Q&A 문의하기」, 작성하기·내 Q&A 보기를 그린다", async () => {
    const html = await render(
      <ProductQna productId="prod_1" data={{ contents: [], totalElements: 0 }} loggedIn={false} />,
    );
    expect(html).toContain("상품에 대해 궁금한 게 있으십니까?");
    expect(html).toContain("Q&amp;A 문의하기");
    expect(html).toContain("상품 Q&amp;A 작성하기");
    expect(html).toContain('href="/account/inquiries"');
  });

  it("Q&A 목록: 제목은 첫 줄, 다른 사람의 비밀글은 잠기고 펼칠 수 없다", async () => {
    const html = await render(
      <ProductQna
        productId="prod_1"
        loggedIn
        data={{
          contents: [inquiry({}), inquiry({ inquiryId: "q2", secret: true, content: null })],
          totalElements: 2,
        }}
      />,
    );
    expect(html).toContain("M 사이즈 총장이 궁금합니다");
    expect(html).not.toContain("자세히 알려 주십시오");
    expect(html).toContain("비밀글입니다");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?비밀글입니다/);
    expect(html).toContain('aria-expanded="false"');
  });

  it("상품정보 표: 상품번호 복사, 고시는 버튼으로 펼친다", async () => {
    const html = await render(
      <ProductInfoSection
        product={product}
        brand="오늘의옷장"
        noticeRows={[{ label: "제품 소재", value: "폴리에스터 100%" }]}
      />,
    );
    expect(html).toContain("prod_1");
    expect(html).toContain("복사");
    expect(html).toContain("원피스");
    expect(html).toContain("폴리에스터 100%");
    expect(html).toContain("상품정보제공고시 보기");
    expect(html).toMatch(/<div[^>]*hidden=""/);
  });

  it("판매자정보: 카드·아코디언·반품/교환 안내·판매자 표 링크를 그리고 신고 항목은 없다", async () => {
    const html = await render(
      <SellerSection
        product={product}
        seller={sellerInfoOf(null)}
        storeName="오늘의옷장"
        onContact={() => {}}
      />,
    );
    for (const text of [
      "스토어홈",
      "판매자정보",
      "반품/교환 안내",
      "주의사항",
      "쇼핑 안전거래 TIP",
      "청약철회 안내",
      "판매자 상세정보 확인",
      "판매자 개인정보 처리방침",
      "123-45-67890",
    ]) {
      expect(html).toContain(text);
    }
    expect(html).not.toContain("상품정보 신고");
  });

  it("내 상품 문의: 상품 썸네일·이름·상품 링크와 문의 유형을 보인다", async () => {
    const html = await render(
      <ul>
        <InquiryItem
          inquiry={inquiry({
            mine: true,
            category: "DELIVERY",
            thumbnailUrl: "https://cdn.example.com/p.jpg",
          })}
          showProduct
        />
      </ul>,
    );
    expect(html).toContain('href="/products/prod_1"');
    expect(html).toContain("레드 플레어 미디 원피스");
    expect(html).toContain("https://cdn.example.com/p.jpg");
    expect(html).toContain("배송");
  });

  it("반품/교환 배송비는 상품 응답 값이고, 0원은 무료, 배송 없는 상품은 한 줄 안내다", () => {
    const shipping = (returnFee: number, exchangeFee: number) =>
      ({
        type: "SHIPPING",
        requiresShipping: true,
        shipping: {
          deliveryType: "PAID",
          deliveryFee: 3000,
          conditionalFreeAmount: null,
          estimatedDays: "1~2일",
          returnDeliveryFee: returnFee,
          exchangeDeliveryFee: exchangeFee,
        },
      }) as ProductDetail["fulfillment"];
    expect(returnFeeRows(shipping(3000, 6000)).map((r) => r.value)).toEqual([
      "3,000원 (단순 변심)",
      "6,000원 (단순 변심)",
    ]);
    expect(returnFeeRows(shipping(0, 0)).map((r) => r.value)).toEqual(["무료", "무료"]);
    const manual = returnFeeRows({
      type: "MANUAL",
      requiresShipping: false,
    } as ProductDetail["fulfillment"]);
    expect(manual).toHaveLength(1);
    expect(manual[0]?.value).toContain("배송 없이");
  });

  it("리뷰 옵션 필터: 조합이 둘 이상이면 「전체 옵션」 기본의 드롭다운을 그린다", async () => {
    const html = await render(
      <ProductReviews
        productId="prod_1"
        variants={[
          { variantId: "v1", name: "레드 / S" },
          { variantId: "v2", name: "레드 / M" },
        ]}
        initial={{
          contents: [],
          totalElements: 1,
          totalPages: 1,
          summary: { averageRating: 4, totalCount: 1, distribution: { "4": 1 } },
          photos: [],
        }}
      />,
    );
    expect(html).toContain('aria-label="옵션"');
    expect(html).toContain("전체 옵션");
    expect(html).toContain('value="v2"');
  });

  it("확인 대화상자: 열리면 alertdialog(aria-modal), 닫히면 아무것도 그리지 않는다", () => {
    const props = {
      title: "리뷰를 삭제하시겠습니까?",
      body: "삭제한 리뷰는 되돌릴 수 없습니다.",
      confirmLabel: "삭제",
      cancelLabel: "취소",
      onConfirm: () => {},
      onCancel: () => {},
    };
    expect(renderToString(<ConfirmDialog open={false} {...props} />)).toBe("");
    const html = renderToString(<ConfirmDialog open {...props} />);
    expect(html).toContain('role="alertdialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("리뷰를 삭제하시겠습니까?");
  });

  it("구매 영역: 할인율만 포인트 색이고 판매가는 잉크다. 리뷰가 없으면 별점 줄을 그리지 않는다", async () => {
    const html = await render(
      <ProductSummary
        product={{
          ...product,
          salePrice: 20000,
          discountedPrice: 15000,
          originalPrice: null,
          averageRating: 0,
          reviewCount: 0,
          freeShipping: true,
          soldOut: false,
          purchasePoint: null,
        }}
        onJump={() => {}}
        myCouponCount={2}
      />,
    );
    expect(html).toMatch(/<span class="text-point">25(<!-- -->)?%<\/span>/);
    expect(html).toMatch(/<span class="tabular text-ink">15,000원<\/span>/);
    expect(html).toContain("무료배송");
    expect(html).toContain("보유 쿠폰 2장");
    expect(html).not.toContain("리뷰 0건");
  });

  it("따라오는 구매 상자는 서버 렌더에서 숨김(inert)으로 시작하고 장바구니·바로구매를 둔다", async () => {
    const detail = {
      ...product,
      salePrice: 20000,
      discountedPrice: null,
      originalPrice: null,
      soldOut: false,
      optionGroups: [{ groupId: "g1", name: "사이즈", values: [{ valueId: "s", name: "S" }] }],
      variants: [
        {
          variantId: "v1",
          variantNo: null,
          valueIds: ["s"],
          name: "S",
          additionalPrice: 0,
          soldOut: false,
        },
      ],
      addonGroups: [],
      customInputs: [],
    } as unknown as ProductDetail;
    const html = await render(
      <QueryClientProvider client={new QueryClient()}>
        <PurchaseProvider product={detail}>
          <FollowingBuyBox targetId="buy-box" top={0} onChangeOptions={() => {}} />
        </PurchaseProvider>
      </QueryClientProvider>,
    );
    expect(html).toMatch(/<aside[^>]*inert=""/);
    expect(html).toContain("invisible");
    expect(html).toContain("옵션을 선택해 주십시오");
    expect(html).toContain("장바구니");
    expect(html).toContain("바로구매");
  });

  it("탭 바: 탭 수만큼 균등 분할하고 첫 탭이 현재 위치다", async () => {
    const html = await render(
      <ProductDetailTabs
        headerHeight={64}
        tabs={[
          { id: "detail", label: "상세정보" },
          { id: "reviews", label: "리뷰 3" },
          { id: "qna", label: "Q&A 0" },
        ]}
      />,
    );
    expect(html).toContain("repeat(3, minmax(0, 1fr))");
    expect(html).toMatch(/<a[^>]*href="#detail"[^>]*aria-current="location"/);
    expect(html).toContain("리뷰 3");
  });
});
