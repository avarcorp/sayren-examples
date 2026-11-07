import type { ProductDetail } from "@sayren/storefront-sdk";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Gallery } from "../../components/product/gallery";
import { InquiryForm } from "../../components/product/inquiry-form";
import { InquiryList } from "../../components/product/inquiry-list";
import { NoticeTable, SellerAndReturn } from "../../components/product/product-info";
import { ProductTabs } from "../../components/product/product-tabs";
import { PurchaseBox, StickyBuyBar } from "../../components/product/purchase-box";
import { ReviewList } from "../../components/product/review-list";
import { ProductGrid } from "../../components/product-card";
import { SectionTitle } from "../../components/ui";
import { m } from "../../i18n";
import { sessionQuery, wishlistQuery } from "../../lib/account-queries";
import { productPathParam } from "../../lib/product-path";
import {
  productInquiriesQuery,
  productQuery,
  productReviewsQuery,
  productsQuery,
} from "../../lib/queries";

const RELATED_SIZE = 8;

export const Route = createFileRoute("/products/$productId")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.productId));
    if (!product) throw notFound();
    // 보조 구획은 병렬로 받고 하나가 실패해도 상세는 그린다
    const session = await context.queryClient.ensureQueryData(sessionQuery());
    await Promise.allSettled([
      session ? context.queryClient.ensureQueryData(wishlistQuery()) : null,
      context.queryClient.ensureQueryData(productReviewsQuery(product.productId)),
      context.queryClient.ensureQueryData(productInquiriesQuery(product.productId)),
      context.queryClient.ensureQueryData(
        productsQuery({ categoryId: product.categoryPath.at(-1)?.categoryId, size: RELATED_SIZE }),
      ),
    ]);
    return { title: product.name };
  },
  head: ({ loaderData }) => ({ meta: loaderData ? [{ title: loaderData.title }] : [] }),
  component: ProductPage,
});

function ProductPage() {
  const { productId } = Route.useParams();
  const product = useSuspenseQuery(productQuery(productId)).data;
  if (!product) return null;
  return <ProductView product={product} />;
}

function ProductView({ product }: { product: ProductDetail }) {
  const reviews = useSuspenseQuery(productReviewsQuery(product.productId)).data;
  const inquiries = useSuspenseQuery(productInquiriesQuery(product.productId)).data;
  const related = useSuspenseQuery(
    productsQuery({ categoryId: product.categoryPath.at(-1)?.categoryId, size: RELATED_SIZE }),
  ).data.contents.filter((p) => p.productId !== product.productId && !p.soldOut);

  return (
    <main className="flex flex-col gap-10 pb-24 lg:pb-0">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
        <Gallery name={product.name} images={product.images} soldOut={product.soldOut} />
        <div className="lg:sticky lg:top-28 lg:self-start">
          <PurchaseBox product={product} />
        </div>
      </div>

      <ProductTabs reviewCount={reviews.totalElements} inquiryCount={inquiries.totalElements} />

      <section
        id="detail"
        aria-labelledby="detail-title"
        className="flex scroll-mt-40 flex-col gap-8 lg:max-w-[48rem]"
      >
        <h2 id="detail-title" className="sr-only">
          {m.product_tab_detail()}
        </h2>
        {/* 서버가 정화한 HTML이다(상품 상세설명) */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: 서버 정화 HTML */}
        <div className="rich-text" dangerouslySetInnerHTML={{ __html: product.description }} />
        {product.infoSections.map((section) => (
          <section
            key={section.infoSectionId}
            className="flex flex-col gap-3 border-line border-t pt-6"
          >
            <h3 className="font-bold text-lg">{section.title}</h3>
            {/* biome-ignore lint/security/noDangerouslySetInnerHtml: 서버 정화 HTML(안내 섹션) */}
            <div className="rich-text" dangerouslySetInnerHTML={{ __html: section.body }} />
          </section>
        ))}
        <NoticeTable product={product} />
      </section>

      <section
        id="reviews"
        aria-labelledby="reviews-title"
        className="flex scroll-mt-40 flex-col gap-4 lg:max-w-[48rem]"
      >
        <SectionTitle id="reviews-title">{m.reviews_title()}</SectionTitle>
        <ReviewList summary={reviews.summary} reviews={reviews.contents} />
      </section>

      <section
        id="inquiries"
        aria-labelledby="inquiries-title"
        className="flex scroll-mt-40 flex-col gap-4 lg:max-w-[48rem]"
      >
        <SectionTitle id="inquiries-title">{m.inquiries_title()}</SectionTitle>
        <InquiryForm productId={product.productId} productPath={productPathParam(product)} />
        <InquiryList inquiries={inquiries.contents} emptyMessage={m.inquiries_empty()} />
      </section>

      <section
        id="seller"
        aria-labelledby="seller-title"
        className="flex scroll-mt-40 flex-col gap-4 lg:max-w-[48rem]"
      >
        <h2 id="seller-title" className="sr-only">
          {m.product_tab_seller()}
        </h2>
        <SellerAndReturn product={product} />
      </section>

      {related.length > 0 ? (
        <section aria-labelledby="related-title" className="flex flex-col gap-6">
          <div className="border-ink border-b pb-3">
            <SectionTitle id="related-title">{m.product_related()}</SectionTitle>
          </div>
          <ProductGrid products={related.slice(0, 4)} />
        </section>
      ) : null}

      <StickyBuyBar product={product} />
    </main>
  );
}
