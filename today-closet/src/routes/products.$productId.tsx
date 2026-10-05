import { ApiError } from "@sayren/storefront-sdk";
import { createFileRoute, notFound, redirect, useRouterState } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { z } from "zod";
import { MobileBuySheet } from "../components/mobile-buy-sheet";
import { useOrdering } from "../components/ordering-notice";
import { FollowingBuyBox } from "../components/pdp/following-buy-box";
import { ProductBuyBox, PurchaseLinks } from "../components/product-buy-box";
import { ProductDescription } from "../components/product-description";
import {
  type DetailTab,
  ProductDetailTabs,
  scrollToSection,
  useHeaderHeight,
} from "../components/product-detail-tabs";
import { ProductGallery } from "../components/product-gallery";
import { ProductInfoSection } from "../components/product-info-section";
import { ProductQna } from "../components/product-inquiries";
import { ProductReviews, type ReviewsData } from "../components/product-reviews";
import { ProductSummary } from "../components/product-summary";
import { PurchaseProvider } from "../components/purchase-context";
import { pickRelated, RelatedProducts } from "../components/related-products";
import { SellerSection } from "../components/seller-section";
import { SectionHeader } from "../components/ui/section";
import { m } from "../i18n";
import { useTrack } from "../lib/analytics";
import { apiFor } from "../lib/api.server";
import { pageTitle } from "../lib/page-title";
import { productNoticeRows } from "../lib/product-notice";
import { isProductNoParam, productPathParam } from "../lib/product-path";
import { REVIEW_PAGE_SIZE } from "../lib/reviews";
import { readToken } from "../lib/session.server";
import { wishedOf } from "../lib/wishlist.server";
import { sellerInfoOf } from "../site/seller";
import type { RootData } from "./__root";

const getProduct = createServerFn({ method: "GET" })
  .validator(z.object({ productId: z.string() }))
  .handler(async ({ data }) => {
    try {
      return await apiFor().catalog.getProduct(data.productId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) throw notFound();
      throw error;
    }
  });

/**
 * 상세 아래 섹션의 데이터 — 리뷰 첫 페이지(랭킹순·요약 포함)와 포토 리뷰, Q&A(로그인했으면 본인 비밀 문의 포함),
 * 찜 여부, 추천(같은 카테고리 판매 중 상품). 받지 못한 섹션은 비거나 숨는다.
 */
const getProductBlocks = createServerFn({ method: "GET" })
  .validator(z.object({ productId: z.string(), categoryId: z.string().nullable() }))
  .handler(async ({ data }) => {
    const accessToken = readToken();
    const api = apiFor({ accessToken });
    const [reviews, photos, inquiries, wished, related, pointPolicy, myCoupons, downloadable] =
      await Promise.all([
        api.catalog
          .listProductReviews(data.productId, { sort: "helpful", page: 1, size: REVIEW_PAGE_SIZE })
          .catch(() => null),
        api.catalog
          .listProductReviews(data.productId, { hasImage: true, sort: "latest", size: 10 })
          .catch(() => null),
        api.catalog.listProductInquiries(data.productId, { size: 10 }).catch(() => null),
        wishedOf(accessToken, data.productId),
        data.categoryId
          ? api.catalog
              .searchProducts({ categoryId: data.categoryId, sort: "recommend", page: 1, size: 12 })
              .catch(() => null)
          : null,
        // 리뷰 적립 안내(상점 정책 값)와 보유 쿠폰 수 — 받지 못하면 그 안내만 숨긴다
        api.catalog.getPointPolicy().catch(() => null),
        accessToken ? api.me.coupons({ status: "available" }).catch(() => null) : null,
        // 이 상품에 쓸 수 있는 받기 쿠폰(#110) — 아직 받지 않은 것만 센다
        api.catalog.listCoupons({ productId: data.productId, size: 50 }).catch(() => null),
      ]);
    const reviewData: ReviewsData | null = reviews && {
      contents: reviews.contents,
      totalElements: reviews.totalElements,
      totalPages: reviews.totalPages,
      summary: reviews.summary ?? null,
      photos: photos?.contents ?? [],
    };
    return {
      reviews: reviewData,
      inquiries: inquiries && {
        contents: inquiries.contents,
        totalElements: inquiries.totalElements,
      },
      loggedIn: Boolean(accessToken),
      wished,
      related: pickRelated(related?.contents ?? [], data.productId),
      reviewReward: pointPolicy?.reviewReward ?? null,
      myCouponCount: myCoupons ? myCoupons.length : null,
      downloadableCouponCount:
        downloadable?.contents.filter((coupon) => coupon.downloadable !== false).length ?? 0,
    };
  });

/** 바로구매 주문서가 만료돼 돌아왔는가 — 주문서가 상품 화면으로 되돌리며 붙인다 */
const productSearch = z.object({
  directExpired: z.coerce.number().pipe(z.literal(1)).optional().catch(undefined),
});

/**
 * 상품 주소는 `/products/{상품번호}`다(이슈 #107). 상품 id 주소(예전 링크·공유·검색 결과)로 들어오면 번호 주소로
 * 영구 이동(301)한다. 상세 API는 번호를 그대로 받는다. 아래 블록(리뷰·Q&A·찜·추천)은 받은 상품의 id로 부른다.
 */
export const Route = createFileRoute("/products/$productId")({
  validateSearch: productSearch,
  loaderDeps: ({ search }) => ({ directExpired: search.directExpired }),
  loader: async ({ params, deps }) => {
    const ref = params.productId;
    const product = await getProduct({ data: { productId: ref } });
    if (!isProductNoParam(ref) && product.productNo != null) {
      throw redirect({
        to: "/products/$productId",
        params: { productId: String(product.productNo) },
        search: { directExpired: deps.directExpired },
        statusCode: 301,
      });
    }
    // 추천은 상품의 가장 깊은 카테고리로 찾는다
    const categoryId = product.categoryPath.at(-1)?.categoryId ?? null;
    const blockData = await getProductBlocks({
      data: { productId: product.productId, categoryId },
    });
    return { product, blockData };
  },
  head: ({ matches, loaderData }) => ({
    meta: [{ title: pageTitle(matches, loaderData ? loaderData.product.name : m.product_title()) }],
  }),
  component: ProductDetail,
});

/** 모바일 섹션 사이 8px 띠 — 화면 끝까지 닿는다. 데스크톱은 여백으로 가른다 */
function Band() {
  return <div aria-hidden="true" className="-mx-4 h-2 shrink-0 bg-chip md:hidden" />;
}

/**
 * 상품 상세 — 위: 이미지 갤러리 | 구매 영역(정보·옵션·선택 행·버튼). 아래: 탭 바(상세정보·리뷰·Q&A·판매자정보·추천)와
 * 섹션 | lg 이상에서 따라오는 구매 상자(위 구매 영역이 화면 밖으로 나간 뒤에만 보인다).
 * 모바일은 하단 막대(찜·구매하기) → 옵션 시트다. 세 구매 영역은 같은 구매 상태를 쓴다.
 */
function ProductDetail() {
  const { product, blockData } = Route.useLoaderData();
  const { directExpired } = Route.useSearch();
  useTrack({ name: "product_view", productId: product.productId });
  const ordering = useOrdering();
  const headerHeight = useHeaderHeight();
  const root = useRouterState({
    select: (state) => state.matches[0]?.loaderData as RootData | undefined,
  });
  const seller = root?.seller ?? sellerInfoOf(null);
  const storeName = root?.store?.name ?? seller.companyName;
  const [qnaSignal, setQnaSignal] = useState(0);
  const reviewCount = blockData.reviews?.summary?.totalCount ?? product.reviewCount;
  const qnaCount = blockData.inquiries?.totalElements ?? 0;
  const tabs = useMemo<DetailTab[]>(
    () => [
      { id: "detail", label: m.pd_tab_detail() },
      { id: "reviews", label: m.pd_tab_reviews({ count: reviewCount }) },
      { id: "qna", label: m.pd_tab_qna({ count: qnaCount }) },
      { id: "seller", label: m.pd_tab_seller() },
      { id: "related", label: m.pd_tab_related() },
    ],
    [reviewCount, qnaCount],
  );
  // 탭 바 높이(약 56px)까지 덜 내려가 섹션 제목이 가려지지 않게 한다. 배송 「자세히 보기」는 반품/교환 안내가 있는 판매자정보로 간다
  const jump = (id: string) =>
    scrollToSection(id === "shipping" ? "seller" : id, headerHeight + 56);
  // 「문의하기」 — Q&A로 옮겨 가 작성 폼을 연다(비회원은 Q&A의 로그인 안내를 본다)
  const askQuestion = () => {
    setQnaSignal((n) => n + 1);
    jump("qna");
  };
  // 따라오는 상자의 옵션 요약 — 위 구매 영역으로 올라가 첫 옵션 단계에 초점을 둔다
  const changeOptions = () => {
    scrollToSection("buy-box", headerHeight + 16);
    document
      .querySelector<HTMLButtonElement>('#buy-box button[aria-haspopup="listbox"]:not(:disabled)')
      ?.focus({ preventScroll: true });
  };
  const noticeRows = productNoticeRows(product, seller.phone);

  return (
    <PurchaseProvider product={product} initialWished={blockData.wished}>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start md:gap-10 lg:grid-cols-[minmax(0,38rem)_27.5rem] lg:justify-between lg:gap-16">
        {/* 모바일은 이미지를 화면 끝까지, 데스크톱은 첫 화면에 이미지가 다 들어오게 폭을 줄인다 */}
        <div className="-mx-4 -mt-8 min-w-0 md:mx-0 md:mt-0">
          <ProductGallery product={product} />
        </div>
        <div id="buy-box" className="flex min-w-0 flex-col gap-6">
          <ProductSummary
            product={product}
            onJump={jump}
            myCouponCount={blockData.myCouponCount}
            downloadableCouponCount={blockData.downloadableCouponCount}
          />
          {directExpired ? (
            <p role="status" className="bg-chip p-3.5 text-body">
              {m.product_purchase_direct_expired()}
            </p>
          ) : null}
          {/* 모바일은 하단 막대의 시트로 고른다 — 같은 구매 상태다 */}
          <div className="hidden md:block">
            <ProductBuyBox mode="main" onInquiry={askQuestion} />
          </div>
          <div className="md:hidden">
            <PurchaseLinks onInquiry={askQuestion} />
          </div>
        </div>
      </div>

      <div className="mt-6 md:hidden">
        <Band />
      </div>
      <div className="grid grid-cols-1 gap-12 md:mt-20 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col">
          <ProductDetailTabs tabs={tabs} headerHeight={headerHeight} />
          <section
            id="detail"
            aria-label={m.pd_tab_detail()}
            className="flex min-w-0 flex-col gap-10 py-6 md:pt-12 md:pb-0"
          >
            <ProductDescription description={product.description ?? ""} />
            <ProductInfoSection product={product} brand={storeName} noticeRows={noticeRows} />
          </section>
          <Band />
          <section
            id="reviews"
            aria-label={m.pd_tab_reviews({ count: reviewCount })}
            className="flex min-w-0 flex-col gap-4 py-6 md:gap-5 md:pt-16 md:pb-0"
          >
            <SectionHeader title={m.rv_title()} count={reviewCount} />
            <ProductReviews
              productId={product.productId}
              initial={blockData.reviews}
              variants={product.variants}
              reward={blockData.reviewReward}
            />
          </section>
          <Band />
          <section
            id="qna"
            aria-label={m.pd_tab_qna({ count: qnaCount })}
            className="min-w-0 py-6 md:pt-16 md:pb-0"
          >
            <ProductQna
              productId={product.productId}
              productPath={productPathParam(product)}
              data={blockData.inquiries}
              loggedIn={blockData.loggedIn}
              writeSignal={qnaSignal}
            />
          </section>
          <Band />
          <section
            id="seller"
            aria-label={m.pd_tab_seller()}
            className="flex min-w-0 flex-col gap-4 py-6 md:gap-5 md:pt-16 md:pb-0"
          >
            <SectionHeader title={m.pd_tab_seller()} />
            <SellerSection
              product={product}
              seller={seller}
              storeName={storeName}
              onContact={askQuestion}
            />
          </section>
          <Band />
          <section
            id="related"
            aria-label={m.pd_tab_related()}
            className="min-w-0 py-6 md:pt-16 md:pb-0"
          >
            <RelatedProducts products={blockData.related} />
          </section>
        </div>
        <div className="hidden lg:block">
          <FollowingBuyBox
            targetId="buy-box"
            top={headerHeight + 72}
            onChangeOptions={changeOptions}
          />
        </div>
      </div>

      {ordering.open ? <MobileBuySheet /> : null}
    </PurchaseProvider>
  );
}
