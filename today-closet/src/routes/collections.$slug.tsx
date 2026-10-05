import { collectionProductSortSchema } from "@sayren/storefront-sdk";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryStates } from "nuqs";
import { Pagination } from "../components/browse/pagination";
import { ProductResults, ResultBar } from "../components/browse/product-results";
import { SortControl } from "../components/browse/sort-control";
import { PageTitle } from "../components/ui/section";
import { m } from "../i18n";
import { useTrack } from "../lib/analytics";
import { collectionProductsQuery, collectionQuery } from "../lib/catalog-queries";
import {
  COLLECTION_SORT_LABELS,
  collectionSearchParams,
  defaultCollectionSort,
  parseCollectionSearch,
} from "../lib/collection-search";
import { pageTitle } from "../lib/page-title";

export const Route = createFileRoute("/collections/$slug")({
  // 정렬·페이지는 URL에 둔다(`lib/collection-search.ts`). 정렬이 없으면 셀러가 지정한 기본 정렬이다
  validateSearch: parseCollectionSearch,
  loaderDeps: ({ search }) => search,
  // 없음·숨김·기간 밖은 서버 함수가 notFound로 바꾼다 — 사이트의 없는 화면(404)이 그려진다
  loader: async ({ context, params, deps }) => {
    const [collection] = await Promise.all([
      context.queryClient.ensureQueryData(collectionQuery(params.slug)),
      context.queryClient.ensureQueryData(collectionProductsQuery(params.slug, deps)),
    ]);
    return {
      title: collection.metaTitle ?? collection.title,
      description: collection.metaDescription,
    };
  },
  head: ({ matches, loaderData }) => ({
    meta: [
      { title: pageTitle(matches, loaderData?.title ?? m.collection_title()) },
      ...(loaderData?.description
        ? [{ name: "description", content: loaderData.description }]
        : []),
    ],
  }),
  component: CollectionPage,
});

/**
 * 컬렉션 화면 — 셀러가 상점 플랫폼 상품 › 컬렉션에서 만든 묶음(기획전·이벤트·신상품)이다. 대표 이미지·제목·설명 아래에
 * 판매 중인 상품을 그린다. 열 수·카드 모양은 상품 목록과 같은 `src/site/layout.json`의 `list`다.
 * 링크는 `/collections/{주소}`다 — 레이아웃의 헤더 메뉴·배너 링크에 걸 수 있다.
 */
function CollectionPage() {
  const { slug } = Route.useParams();
  const applied = Route.useSearch();
  const { data: collection } = useSuspenseQuery(collectionQuery(slug));
  const { data: page } = useSuspenseQuery(collectionProductsQuery(slug, applied));
  const [, setSearch] = useQueryStates(collectionSearchParams, { history: "push" });
  useTrack({
    name: "product_list_view",
    listId: `collection:${slug}`,
    productIds: page.contents.map((product) => product.productId),
  });

  const defaultSort = defaultCollectionSort(collection.productSort);

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <header className="flex flex-col gap-4">
        {collection.imageUrl ? (
          <img
            src={collection.imageUrl}
            alt=""
            className="-mx-4 aspect-[2/1] w-[calc(100%+2rem)] max-w-none bg-chip object-cover md:mx-0 md:aspect-[3/1] md:w-full"
          />
        ) : null}
        <PageTitle
          description={
            collection.description ? (
              <span className="whitespace-pre-line">{collection.description}</span>
            ) : undefined
          }
        >
          {collection.title}
        </PageTitle>
      </header>

      <div className="flex min-w-0 flex-col gap-4 md:border-ink md:border-t md:pt-4">
        <ResultBar
          count={page.totalElements}
          sort={
            <SortControl
              options={collectionProductSortSchema.options.map((value) => ({
                value,
                label: COLLECTION_SORT_LABELS[value],
              }))}
              value={applied.sort ?? defaultSort}
              // 기본 정렬은 주소에서 뺀다. 정렬을 바꾸면 1페이지부터다
              onChange={(sort) =>
                void setSearch({ sort: sort === defaultSort ? null : sort, page: null })
              }
            />
          }
        />
        <ProductResults products={page.contents} empty={{ title: m.collection_empty() }} />
        <Pagination
          page={page.page}
          totalPages={page.totalPages}
          renderLink={({ page: target, children, ...props }) => (
            <Link
              from={Route.fullPath}
              to="/collections/$slug"
              params={{ slug }}
              search={(prev) => ({ ...prev, page: target > 1 ? target : undefined })}
              {...props}
            >
              {children}
            </Link>
          )}
        />
      </div>
    </div>
  );
}
