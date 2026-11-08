import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductGrid } from "../components/product-card";
import { Container, EmptyState, SectionTitle } from "../components/ui";
import { useCategories, useProducts } from "../hooks/use-catalog";
import { m } from "../i18n";
import { categoriesQuery, productsQuery } from "../lib/queries";

const HOME_PRODUCTS = { page: 1, size: 24, sort: "recommend" } as const;

/** 홈 — 상품 그리드가 첫 화면이다(히어로 없음). 아래에 카테고리 바로가기만 둔다 */
export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQuery(HOME_PRODUCTS)),
      context.queryClient.ensureQueryData(categoriesQuery()),
    ]),
  component: Home,
});

function Home() {
  const products = useProducts(HOME_PRODUCTS);
  const categories = useCategories();
  return (
    <Container className="flex flex-col gap-10 pt-5">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <SectionTitle>{m.home_title()}</SectionTitle>
          <Link to="/products" className="min-h-11 content-center text-meta text-point">
            {m.home_view_all()}
          </Link>
        </div>
        {products.contents.length === 0 ? (
          <EmptyState message={m.home_no_products()} />
        ) : (
          <ProductGrid products={products.contents} eagerCount={4} />
        )}
      </section>
      {categories.length > 0 ? (
        <section className="flex flex-col gap-3">
          <SectionTitle>{m.home_categories()}</SectionTitle>
          <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {categories.map((category) => (
              <li key={category.categoryId}>
                <Link
                  to="/products"
                  search={{ category: category.categoryId }}
                  className="flex min-h-12 items-center justify-center rounded-control border border-line-strong px-3 text-body hover:border-point hover:text-point"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Container>
  );
}
