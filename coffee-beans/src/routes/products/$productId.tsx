import { sellerInfoOf } from "@sayren/storefront-sdk";
import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState } from "react";
import { DeliveryNotice } from "../../components/delivery-notice";
import { Price } from "../../components/price";
import { Gallery } from "../../components/product/gallery";
import { InfoSections, NoticeTable } from "../../components/product/info-sections";
import { InquiryList } from "../../components/product/inquiry-list";
import { ProductTabs } from "../../components/product/product-tabs";
import { OptionPicker, PurchaseActions, usePurchase } from "../../components/product/purchase-box";
import { ReviewList } from "../../components/product/review-list";
import { ProductGrid } from "../../components/product-card";
import { Button, Container, SectionTitle, Stars } from "../../components/ui";
import { useSession } from "../../hooks/use-account";
import {
  useProduct,
  useProductInquiries,
  useProductReviews,
  useProducts,
  useStore,
} from "../../hooks/use-catalog";
import { m } from "../../i18n";
import { productPathParam } from "../../lib/product-path";
import {
  productInquiriesQuery,
  productQuery,
  productReviewsQuery,
  productsQuery,
} from "../../lib/queries";

const RELATED_SIZE = 9;

/**
 * 상품 상세 — 갤러리 → 구매 상자(이름·가격·옵션·담기) → 탭(상세·리뷰·문의·판매자 정보) → 같은 카테고리 추천.
 * 390px은 하단 구매 바가 구매 시트를 연다. 리뷰·문의는 상품 id로 조회한다
 */
export const Route = createFileRoute("/products/$productId")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.productId));
    if (!product) throw notFound();
    const canonical = productPathParam(product);
    if (canonical !== params.productId)
      throw redirect({ to: "/products/$productId", params: { productId: canonical } });
    const categoryId = product.categoryPath.at(-1)?.categoryId;
    await Promise.all([
      context.queryClient.ensureQueryData(productReviewsQuery(product.productId)),
      context.queryClient.ensureQueryData(productInquiriesQuery(product.productId)),
      context.queryClient.ensureQueryData(productsQuery({ categoryId, size: RELATED_SIZE })),
    ]);
  },
  component: ProductPage,
});

function ProductPage() {
  const { productId } = Route.useParams();
  const product = useProduct(productId);
  if (!product) return null;
  return <ProductDetailView product={product} />;
}

function ProductDetailView({ product }: { product: NonNullable<ReturnType<typeof useProduct>> }) {
  const store = useStore();
  const member = useSession();
  const reviews = useProductReviews(product.productId);
  const inquiries = useProductInquiries(product.productId);
  const categoryId = product.categoryPath.at(-1)?.categoryId;
  const related = useProducts({ categoryId, size: RELATED_SIZE }).contents.filter(
    (p) => p.productId !== product.productId,
  );
  const purchase = usePurchase(product, member !== null);
  const [sheet, setSheet] = useState(false);
  const orderable = store.checkoutAvailable;
  const seller = sellerInfoOf(store);

  return (
    <Container className="pt-4 pb-24 md:pb-0">
      {product.categoryPath.length > 0 ? (
        <nav className="pb-3 text-caption text-muted">
          {product.categoryPath.map((c) => (
            <Link
              key={c.categoryId}
              to="/products"
              search={{ category: c.categoryId }}
              className="hover:text-point"
            >
              {c.name}
            </Link>
          ))}
        </nav>
      ) : null}
      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <Gallery images={product.images} name={product.name} />
        <section className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h1 className="break-words font-bold text-xl leading-snug">{product.name}</h1>
            {product.reviewCount > 0 ? (
              <a href="#reviews" className="flex items-center gap-1 text-caption text-muted">
                <Stars rating={product.averageRating} />
                <span className="tabular">{m.reviews_count({ count: product.reviewCount })}</span>
              </a>
            ) : null}
            <Price product={product} size="lg" />
            {product.purchasePoint !== null ? (
              <p className="text-caption text-muted">
                {m.purchase_point({ point: product.purchasePoint })}
              </p>
            ) : null}
          </div>
          <DeliveryNotice fulfillment={product.fulfillment} currency={product.currency} />
          <div className="hidden flex-col gap-5 border-line border-t pt-5 md:flex">
            <OptionPicker product={product} purchase={purchase} />
            <PurchaseActions purchase={purchase} orderable={orderable} />
          </div>
        </section>
      </div>

      <div className="mt-10 flex flex-col">
        <ProductTabs
          counts={{ reviews: reviews.summary?.totalCount ?? 0, inquiries: inquiries.totalElements }}
        />
        <section id="detail" className="scroll-mt-36 py-6">
          <div
            className="product-description break-words text-body leading-relaxed [&_h3]:mt-5 [&_h3]:mb-1 [&_h3]:font-semibold [&_img]:h-auto [&_img]:max-w-full"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: 서버가 정화한 상세설명 HTML이다
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
          <div className="mt-6">
            <InfoSections sections={product.infoSections} />
            <NoticeTable notice={product.notice} />
          </div>
        </section>
        <section id="reviews" className="scroll-mt-36 border-line border-t py-6">
          <SectionTitle>{m.tab_reviews()}</SectionTitle>
          <div className="pt-4">
            <ReviewList reviews={reviews} />
          </div>
        </section>
        <section id="inquiries" className="scroll-mt-36 border-line border-t py-6">
          <SectionTitle>{m.tab_inquiries()}</SectionTitle>
          <div className="pt-4">
            <InquiryList
              productId={product.productId}
              inquiries={inquiries.contents}
              signedIn={member !== null}
            />
          </div>
        </section>
        <section id="seller" className="scroll-mt-36 border-line border-t py-6">
          <SectionTitle>{m.tab_seller()}</SectionTitle>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 pt-4 text-meta">
            <dt className="text-muted">{m.seller_store()}</dt>
            <dd className="min-w-0 break-words">{store.name}</dd>
            {seller.map((row) => (
              <div key={row.field} className="contents">
                <dt className="text-muted">{m[`seller_${row.field}` as const]()}</dt>
                <dd className="min-w-0 break-words">{row.value}</dd>
              </div>
            ))}
            <dt className="text-muted">{m.seller_return_period()}</dt>
            <dd>{m.seller_return_days({ days: product.returnPeriodDays })}</dd>
          </dl>
        </section>
      </div>

      {related.length > 0 ? (
        <section className="flex flex-col gap-4 border-line border-t pt-6">
          <SectionTitle>{m.related_title()}</SectionTitle>
          <ProductGrid products={related.slice(0, 8)} />
        </section>
      ) : null}

      {orderable ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-line border-t bg-page px-4 py-2 md:hidden">
          <Button className="w-full" onClick={() => setSheet(true)}>
            {m.purchase_open_sheet()}
          </Button>
        </div>
      ) : null}
      {sheet ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label={m.nav_close()}
            className="absolute inset-0 bg-ink/30"
            onClick={() => setSheet(false)}
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col overflow-y-auto rounded-t-[12px] bg-page px-4 pt-2 pb-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-body">{m.purchase_sheet_title()}</span>
              <button
                type="button"
                aria-label={m.nav_close()}
                className="grid size-11 place-items-center"
                onClick={() => setSheet(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex flex-col gap-5">
              <OptionPicker product={product} purchase={purchase} />
              <PurchaseActions purchase={purchase} orderable={orderable} />
            </div>
          </div>
        </div>
      ) : null}
    </Container>
  );
}
