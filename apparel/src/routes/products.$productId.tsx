import { deliveryNoticeOf } from "@sayren/storefront-sdk";
import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { Gallery } from "../components/product/gallery";
import { Price } from "../components/product/price";
import { ProductGrid } from "../components/product/product-card";
import {
  DetailSection,
  GuideSection,
  InquirySection,
  ReviewSection,
  SectionTabs,
} from "../components/product/product-sections";
import { PurchaseBox } from "../components/product/purchase-box";
import { Container } from "../components/ui/page-title";
import { useProduct, useProductExtras, useProducts, useStore } from "../hooks/use-catalog";
import { m } from "../i18n";
import { deliveryNoticeText } from "../lib/delivery";
import { formatMoney } from "../lib/format";
import { productExtrasQuery, productQuery, productsQuery } from "../lib/queries";

const RELATED_SIZE = 8;

export const Route = createFileRoute("/products/$productId")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.productId));
    if (!product) throw notFound();
    // 상품 id 주소로 들어오면 상품번호 주소로 옮긴다(공유·검색 주소를 하나로)
    if (product.productNo !== null && params.productId !== String(product.productNo)) {
      throw redirect({
        to: "/products/$productId",
        params: { productId: String(product.productNo) },
        statusCode: 301,
      });
    }
    const categoryId = product.categoryPath.at(-1)?.categoryId;
    await Promise.all([
      context.queryClient.ensureQueryData(productExtrasQuery(product.productId)),
      context.queryClient.ensureQueryData(productsQuery({ categoryId, size: RELATED_SIZE })),
    ]);
    return { name: product.name };
  },
  head: ({ loaderData }) => ({ meta: loaderData ? [{ title: loaderData.name }] : [] }),
  component: ProductPage,
});

function ProductPage() {
  const { productId } = Route.useParams();
  const store = useStore();
  const product = useProduct(productId);
  if (!product) throw notFound();
  const extras = useProductExtras(product.productId);
  const categoryId = product.categoryPath.at(-1)?.categoryId;
  const related = useProducts({ categoryId, size: RELATED_SIZE }).contents.filter(
    (p) => p.productId !== product.productId,
  );
  const deliveryText = deliveryNoticeText(deliveryNoticeOf(product.fulfillment), product.currency);

  return (
    <Container className="pb-24 md:pb-0">
      <div className="grid gap-6 pt-4 md:grid-cols-[minmax(0,1fr)_400px] md:gap-12 md:pt-8">
        <div className="-mx-4 md:mx-0">
          <Gallery images={product.images} name={product.name} />
        </div>
        <div className="flex min-w-0 flex-col gap-5 md:sticky md:top-28 md:self-start">
          {product.categoryPath.length > 0 ? (
            <nav aria-label={m.breadcrumb()} className="text-caption text-muted">
              {product.categoryPath.map((c) => (
                <Link
                  key={c.categoryId}
                  to="/products"
                  search={{ category: c.categoryId }}
                  className="hover:underline"
                >
                  {c.name}
                </Link>
              ))}
            </nav>
          ) : null}
          <div className="flex flex-col gap-2">
            <h1 className="break-words font-semibold text-xl">{product.name}</h1>
            {product.reviewCount > 0 ? (
              <a href="#reviews" className="text-meta text-sub underline underline-offset-4">
                ★ {product.averageRating.toFixed(1)} ·{" "}
                {m.reviews_count({ count: product.reviewCount })}
              </a>
            ) : null}
            <Price product={product} size="lg" />
            {product.purchasePoint ? (
              <p className="text-meta text-sub">
                {m.product_purchase_point({
                  amount: formatMoney(product.purchasePoint, product.currency),
                })}
              </p>
            ) : null}
            {deliveryText ? <p className="text-meta text-sub">{deliveryText}</p> : null}
          </div>
          <PurchaseBox product={product} checkoutAvailable={store.checkoutAvailable} />
        </div>
      </div>

      <div className="max-w-3xl pt-10">
        <SectionTabs reviewCount={product.reviewCount} />
        <DetailSection product={product} />
        <ReviewSection reviews={extras.reviews} />
        <InquirySection productId={product.productId} inquiries={extras.inquiries} />
        <GuideSection store={store} product={product} deliveryText={deliveryText} />
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="related-title" className="pt-16">
          <h2 id="related-title" className="pb-4 font-semibold text-body-lg">
            {m.product_related()}
          </h2>
          <ProductGrid products={related.slice(0, 4)} />
        </section>
      ) : null}
    </Container>
  );
}
