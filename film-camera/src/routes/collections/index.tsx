import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyState, PageHeader } from "../../components/ui";
import { m } from "../../i18n";
import { collectionsQuery } from "../../lib/queries";

export const Route = createFileRoute("/collections/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(collectionsQuery()),
  component: Collections,
});

function Collections() {
  const collections = useSuspenseQuery(collectionsQuery()).data;
  return (
    <main className="flex flex-col gap-6">
      <PageHeader title={m.collections_title()} />
      {collections.contents.length === 0 ? (
        <EmptyState message={m.collections_empty()} />
      ) : (
        <ul className="divide-y divide-line border-line border-b">
          {collections.contents.map((collection) => (
            <li key={collection.collectionId}>
              <Link
                to="/collections/$slug"
                params={{ slug: collection.slug }}
                className="flex flex-col gap-1 py-5 hover:text-point-strong focus-visible:outline-2 focus-visible:outline-point"
              >
                <span className="font-bold text-xl">{collection.title}</span>
                {collection.description ? (
                  <span className="text-body text-sub">{collection.description}</span>
                ) : null}
                <span className="pt-2 text-body text-point-strong underline">
                  {m.collection_view()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
