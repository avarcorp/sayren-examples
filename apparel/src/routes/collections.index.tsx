import { createFileRoute } from "@tanstack/react-router";
import { CollectionCard } from "../components/product/collection-card";
import { EmptyState } from "../components/ui/empty-state";
import { Container, PageTitle } from "../components/ui/page-title";
import { useCollections } from "../hooks/use-catalog";
import { m } from "../i18n";
import { collectionsQuery } from "../lib/queries";

export const Route = createFileRoute("/collections/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(collectionsQuery()),
  component: CollectionList,
});

function CollectionList() {
  const { contents } = useCollections();
  return (
    <Container>
      <PageTitle>{m.nav_collections()}</PageTitle>
      {contents.length === 0 ? (
        <EmptyState message={m.collections_empty()} />
      ) : (
        <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {contents.map((collection) => (
            <li key={collection.collectionId}>
              <CollectionCard collection={collection} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
