import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GradeBadge } from "../components/marks";
import { ProductGrid } from "../components/product-card";
import { EmptyState, SectionTitle } from "../components/ui";
import { m } from "../i18n";
import { collectionsQuery, productsQuery } from "../lib/queries";

/** 홈에 보이는 상품 — 첫 페이지(최신순) */
const HOME_PRODUCTS = { page: 1, size: 24, sort: "latest" } as const;

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQuery(HOME_PRODUCTS)),
      context.queryClient.ensureQueryData(collectionsQuery()),
    ]),
  component: Home,
});

/** 홈 — 상품 그리드가 먼저다. 아래에는 등급별 모음 링크만 둔다(점검·보증·질문은 상품 상세와 /help) */
function Home() {
  const products = useSuspenseQuery(productsQuery(HOME_PRODUCTS)).data;
  const collections = useSuspenseQuery(collectionsQuery()).data;
  const onSale = products.contents.filter((p) => !p.soldOut);

  return (
    <main className="flex flex-col gap-12 lg:gap-16">
      <section aria-labelledby="home-on-sale" className="flex flex-col gap-5 pt-2">
        <div className="flex items-center justify-between gap-4 border-ink border-b pb-1">
          <h1 id="home-on-sale" className="font-bold text-xl tracking-tight">
            {m.home_on_sale_title()}
          </h1>
          <Link
            to="/products"
            className="min-h-11 content-center text-body text-point-strong underline"
          >
            {m.home_view_all()}
          </Link>
        </div>
        {onSale.length > 0 ? (
          <ProductGrid products={onSale} />
        ) : (
          <EmptyState message={m.home_empty()} />
        )}
      </section>

      {collections.contents.length > 0 ? (
        <nav aria-labelledby="home-grades" className="flex flex-col gap-4">
          <div className="border-ink border-b pb-3">
            <SectionTitle id="home-grades">{m.home_grades_title()}</SectionTitle>
          </div>
          <ul className="flex flex-wrap gap-3">
            {collections.contents.map((collection) => (
              <li key={collection.collectionId}>
                <Link
                  to="/collections/$slug"
                  params={{ slug: collection.slug }}
                  className="inline-flex min-h-11 items-center gap-2 border border-line px-4 hover:border-ink focus-visible:outline-2 focus-visible:outline-point"
                >
                  {collection.slug === "a-grade" ? <GradeBadge grade="A" /> : null}
                  {collection.slug === "b-grade" ? <GradeBadge grade="B" /> : null}
                  <span className="font-semibold text-body">{collection.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </main>
  );
}
