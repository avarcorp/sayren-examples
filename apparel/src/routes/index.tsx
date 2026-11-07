import { createFileRoute, Link } from "@tanstack/react-router";
import { CollectionCard } from "../components/product/collection-card";
import { ProductGrid } from "../components/product/product-card";
import { EmptyState } from "../components/ui/empty-state";
import { Container } from "../components/ui/page-title";
import {
  useCategories,
  useCollections,
  useHomeBanner,
  useProducts,
  useStore,
} from "../hooks/use-catalog";
import { m } from "../i18n";
import { collectionsQuery, homeBannerQuery, productsQuery } from "../lib/queries";

/** 홈 상품 — 신상품 첫 페이지 */
const HOME_PRODUCTS = { page: 1, size: 12, sort: "latest" } as const;

/**
 * 홈 — 상품이 먼저 보인다. 이미지 띠 한 줄(높이 120px 이하) → 신상품 그리드 → 카테고리 링크 → 컬렉션 카드
 */
export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQuery(HOME_PRODUCTS)),
      context.queryClient.ensureQueryData(collectionsQuery()),
      context.queryClient.ensureQueryData(homeBannerQuery()),
    ]),
  component: Home,
});

function Home() {
  const store = useStore();
  const products = useProducts(HOME_PRODUCTS);
  const categories = useCategories();
  const collections = useCollections();
  const banner = useHomeBanner();

  return (
    <>
      <h1 className="sr-only">{store.name}</h1>
      {banner ? (
        <Link
          to="/collections/$slug"
          params={{ slug: banner.slug }}
          className="relative block h-24 overflow-hidden md:h-[120px]"
        >
          <img
            src={banner.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
          <span className="absolute bottom-3 left-4 bg-page px-2.5 py-1 font-semibold text-meta md:left-6">
            {banner.title}
          </span>
        </Link>
      ) : null}
      <Container>
        <section aria-labelledby="home-new" className="pt-6 md:pt-10">
          <div className="flex items-baseline justify-between pb-4">
            <h2 id="home-new" className="font-semibold text-body-lg md:text-lg">
              {m.home_new_title()}
            </h2>
            <Link
              to="/products"
              className="flex min-h-11 items-center text-meta text-sub underline underline-offset-4"
            >
              {m.common_view_all()}
            </Link>
          </div>
          {products.contents.length === 0 ? (
            <EmptyState message={m.home_no_products()} />
          ) : (
            <ProductGrid products={products.contents} eagerCount={4} />
          )}
        </section>

        {categories.length > 0 ? (
          <section aria-labelledby="home-categories" className="pt-14">
            <h2 id="home-categories" className="pb-4 font-semibold text-body-lg md:text-lg">
              {m.home_categories_title()}
            </h2>
            <ul className="grid grid-cols-2 border-line border-t sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((category) => (
                <li key={category.categoryId} className="border-line border-b">
                  <Link
                    to="/products"
                    search={{ category: category.categoryId }}
                    className="flex min-h-14 items-center justify-between px-1 text-body hover:text-point"
                  >
                    {category.name}
                    <span aria-hidden className="text-muted">
                      ›
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {collections.contents.length > 0 ? (
          <section aria-labelledby="home-collections" className="pt-14">
            <h2 id="home-collections" className="pb-4 font-semibold text-body-lg md:text-lg">
              {m.home_collections_title()}
            </h2>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {collections.contents.map((collection) => (
                <li key={collection.collectionId}>
                  <CollectionCard collection={collection} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </>
  );
}
