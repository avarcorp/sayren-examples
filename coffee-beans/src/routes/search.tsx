import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Pagination } from "../components/pagination";
import { ProductGrid } from "../components/product-card";
import { Chip, Container, EmptyState, Input, PageTitle } from "../components/ui";
import { useProducts } from "../hooks/use-catalog";
import { m } from "../i18n";
import { productsQuery } from "../lib/queries";
import { clearRecentSearches, readRecentSearches, saveRecentSearch } from "../lib/recent-searches";

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().int().min(1).optional(),
});

const PAGE_SIZE = 24;

/** 통합 검색 — 검색어 입력, 최근 검색어, 결과 그리드. 검색어는 URL에 둔다 */
export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    deps.q
      ? context.queryClient.ensureQueryData(
          productsQuery({ keyword: deps.q, page: deps.page ?? 1, size: PAGE_SIZE }),
        )
      : null,
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [text, setText] = useState(search.q ?? "");
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => setRecent(readRecentSearches()), []);

  const submit = (keyword: string) => {
    const value = keyword.trim();
    if (!value) return;
    setRecent(saveRecentSearch(value));
    setText(value);
    navigate({ search: { q: value } });
  };

  return (
    <Container className="flex flex-col gap-5 pt-5">
      <PageTitle>{m.search_title()}</PageTitle>
      <search>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit(text);
          }}
        >
          <Input
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={m.search_placeholder()}
            aria-label={m.search_title()}
          />
          <button
            type="submit"
            aria-label={m.nav_search()}
            className="grid size-12 shrink-0 place-items-center rounded-control bg-point text-white"
          >
            <Search className="size-5" />
          </button>
        </form>
      </search>
      {search.q ? (
        <SearchResults
          keyword={search.q}
          page={search.page ?? 1}
          onPage={(page) => navigate({ search: { ...search, page } })}
        />
      ) : recent.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-body">{m.search_recent()}</h2>
            <button
              type="button"
              className="min-h-11 text-meta text-muted"
              onClick={() => {
                clearRecentSearches();
                setRecent([]);
              }}
            >
              {m.search_recent_clear()}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((keyword) => (
              <Chip key={keyword} onClick={() => submit(keyword)}>
                {keyword}
              </Chip>
            ))}
          </div>
        </section>
      ) : (
        <p className="text-meta text-muted">{m.search_hint()}</p>
      )}
    </Container>
  );
}

function SearchResults({
  keyword,
  page,
  onPage,
}: {
  keyword: string;
  page: number;
  onPage: (page: number) => void;
}) {
  const products = useProducts({ keyword, page, size: PAGE_SIZE });
  if (products.contents.length === 0) return <EmptyState message={m.search_empty({ keyword })} />;
  return (
    <>
      <p className="text-meta text-sub">{m.search_count({ count: products.totalElements })}</p>
      <ProductGrid products={products.contents} />
      <Pagination page={page} totalPages={products.totalPages} onChange={onPage} />
    </>
  );
}
