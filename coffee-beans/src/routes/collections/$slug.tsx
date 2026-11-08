import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProductGrid } from "../../components/product-card";
import { Container, EmptyState, PageTitle } from "../../components/ui";
import { useCollection, useCollectionProducts } from "../../hooks/use-catalog";
import { m } from "../../i18n";
import { collectionProductsQuery, collectionQuery } from "../../lib/queries";

/** 기획전 상품 — 작은 제목 → 그리드(설명 줄 없음) */
export const Route = createFileRoute("/collections/$slug")({
  loader: async ({ context, params }) => {
    const collection = await context.queryClient.ensureQueryData(collectionQuery(params.slug));
    if (!collection) throw notFound();
    await context.queryClient.ensureQueryData(collectionProductsQuery(params.slug));
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { slug } = Route.useParams();
  const collection = useCollection(slug);
  const products = useCollectionProducts(slug);
  return (
    <Container className="flex flex-col gap-5 pt-5">
      <PageTitle>{collection?.title}</PageTitle>
      {products.contents.length === 0 ? (
        <EmptyState message={m.products_empty()} />
      ) : (
        <ProductGrid products={products.contents} eagerCount={4} />
      )}
    </Container>
  );
}
