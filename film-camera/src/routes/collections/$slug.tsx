import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProductGrid } from "../../components/product-card";
import { EmptyState, PageHeader } from "../../components/ui";
import { m } from "../../i18n";
import { collectionProductsQuery, collectionQuery } from "../../lib/queries";

export const Route = createFileRoute("/collections/$slug")({
  loader: async ({ context, params }) => {
    const collection = await context.queryClient.ensureQueryData(collectionQuery(params.slug));
    if (!collection) throw notFound();
    await context.queryClient.ensureQueryData(collectionProductsQuery(params.slug));
  },
  component: CollectionPage,
  notFoundComponent: () => (
    <main className="flex flex-col gap-6">
      <PageHeader title={m.collection_not_found()} />
      <EmptyState message={m.products_empty()} />
    </main>
  ),
});

function CollectionPage() {
  const { slug } = Route.useParams();
  const collection = useSuspenseQuery(collectionQuery(slug)).data;
  const products = useSuspenseQuery(collectionProductsQuery(slug)).data;
  if (!collection) return null;
  return (
    <main className="flex flex-col gap-6">
      <PageHeader title={collection.title} />
      {products.contents.length > 0 ? (
        <ProductGrid products={products.contents} />
      ) : (
        <EmptyState message={m.products_empty()} />
      )}
    </main>
  );
}
