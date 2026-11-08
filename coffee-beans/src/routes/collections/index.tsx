import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductImage } from "../../components/product-image";
import { Container, EmptyState, PageTitle } from "../../components/ui";
import { useCollections } from "../../hooks/use-catalog";
import { m } from "../../i18n";
import { collectionsQuery } from "../../lib/queries";

/** 기획전 목록 — 대표 사진 카드 */
export const Route = createFileRoute("/collections/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(collectionsQuery()),
  component: CollectionList,
});

function CollectionList() {
  const collections = useCollections();
  return (
    <Container className="flex flex-col gap-5 pt-5">
      <PageTitle>{m.collections_title()}</PageTitle>
      {collections.contents.length === 0 ? (
        <EmptyState message={m.collections_empty()} />
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3">
          {collections.contents.map((collection) => (
            <li key={collection.collectionId} className="min-w-0">
              <Link
                to="/collections/$slug"
                params={{ slug: collection.slug }}
                className="flex flex-col gap-2"
              >
                <ProductImage src={collection.imageUrl} alt={collection.title} />
                <p className="break-words font-semibold text-body">{collection.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
