import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyState, PageTitle } from "../components/ui/section";
import { m } from "../i18n";
import { collectionsQuery } from "../lib/catalog-queries";
import { pageTitle } from "../lib/page-title";

export const Route = createFileRoute("/collections/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(collectionsQuery()),
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, m.collection_list_title()) }] }),
  component: Collections,
});

/**
 * 컬렉션 모음 — 지금 노출 중인 컬렉션을 셀러가 지정한 순서로 보인다. 헤더 메뉴에 걸려면 `src/site/layout.json`의
 * `header.nav`에 `{ "label": "기획전", "to": "/collections" }`처럼 더한다(개별 컬렉션은 `/collections/{주소}`).
 */
function Collections() {
  const { data: page } = useSuspenseQuery(collectionsQuery());
  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <PageTitle>{m.collection_list_title()}</PageTitle>
      {page.contents.length === 0 ? (
        <EmptyState title={m.collection_list_empty()} />
      ) : (
        <ul className="grid gap-x-5 gap-y-8 md:grid-cols-2 md:gap-y-10">
          {page.contents.map((collection) => (
            <li key={collection.collectionId} className="min-w-0">
              <Link
                to="/collections/$slug"
                params={{ slug: collection.slug }}
                className="group flex flex-col gap-3"
              >
                <span className="block aspect-[2/1] overflow-hidden bg-chip">
                  {collection.imageUrl ? (
                    <img
                      src={collection.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : null}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="break-words font-bold text-body-lg md:text-lg">
                    {collection.title}
                  </span>
                  {collection.description ? (
                    <span className="line-clamp-2 break-words text-body text-sub">
                      {collection.description}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
