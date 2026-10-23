import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi, useNavigate } from "@tanstack/react-router";
import { SearchResults, SearchTemplate } from "../components/templates/search-template";
import { useTrack } from "../lib/analytics";
import { keywordSearchSchema, productsQuery } from "../lib/catalog";

const rootRoute = getRouteApi("__root__");
const PAGE_SIZE = 20;

export const Route = createFileRoute("/search")({
  validateSearch: keywordSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    deps.keyword
      ? context.queryClient.ensureQueryData(productsQuery({ ...deps, size: PAGE_SIZE }))
      : null,
  head: () => ({ meta: [{ title: "검색 | 설기로운" }] }),
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  return (
    <SearchTemplate
      keyword={search.keyword}
      onSearch={(keyword) => navigate({ search: { keyword: keyword || undefined } })}
    >
      {search.keyword ? <Results keyword={search.keyword} page={search.page} /> : null}
    </SearchTemplate>
  );
}

/** 결과 — loader가 받아 둔 데이터를 읽는다 */
function Results({ keyword, page }: { keyword: string; page?: number }) {
  const tree = rootRoute.useLoaderData({ select: (d) => d.categories });
  const { data } = useSuspenseQuery(productsQuery({ keyword, page, size: PAGE_SIZE }));
  useTrack({ name: "search", query: keyword, resultCount: data.totalElements });
  return <SearchResults keyword={keyword} page={data} tree={tree} />;
}
