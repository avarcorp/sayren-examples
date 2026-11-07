import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search as SearchIcon, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { z } from "zod";
import { ProductGrid } from "../components/product/product-card";
import { EmptyState } from "../components/ui/empty-state";
import { Container, PageTitle } from "../components/ui/page-title";
import { useProducts } from "../hooks/use-catalog";
import { m } from "../i18n";
import { productsQuery } from "../lib/queries";
import { readRecentSearches, rememberSearch, removeRecentSearch } from "../lib/recent-searches";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ q: search.q?.trim() ?? "" }),
  loader: ({ context, deps }) =>
    deps.q
      ? context.queryClient.ensureQueryData(productsQuery({ keyword: deps.q, size: 40 }))
      : null,
  component: SearchPage,
});

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const keyword = q.trim();
  const navigate = useNavigate({ from: Route.fullPath });
  const [draft, setDraft] = useState(keyword);
  const [recent, setRecent] = useState<string[]>([]);

  // 최근 검색어는 이 브라우저의 편의 기록이다(서버 데이터 아님)
  useEffect(() => {
    if (keyword) rememberSearch(keyword);
    setRecent(readRecentSearches());
  }, [keyword]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = draft.trim();
    if (next) navigate({ search: { q: next } });
  };

  return (
    <Container>
      <PageTitle>{m.search_title()}</PageTitle>
      <form onSubmit={submit} className="flex border border-ink">
        <label htmlFor="search-q" className="sr-only">
          {m.search_label()}
        </label>
        <input
          id="search-q"
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={m.search_placeholder()}
          className="min-h-12 min-w-0 flex-1 bg-page px-3 text-body focus:outline-none"
        />
        <button
          type="submit"
          className="grid size-12 place-items-center"
          aria-label={m.nav_search()}
        >
          <SearchIcon className="size-5" aria-hidden />
        </button>
      </form>
      {keyword ? (
        <SearchResults keyword={keyword} />
      ) : recent.length > 0 ? (
        <section aria-labelledby="recent" className="pt-6">
          <h2 id="recent" className="pb-2 text-meta text-sub">
            {m.search_recent()}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {recent.map((word) => (
              <li key={word} className="flex items-center border border-line-strong">
                <button
                  type="button"
                  className="min-h-10 px-3 text-meta"
                  onClick={() => {
                    setDraft(word);
                    navigate({ search: { q: word } });
                  }}
                >
                  {word}
                </button>
                <button
                  type="button"
                  className="grid size-10 place-items-center text-muted"
                  aria-label={m.search_remove_recent({ word })}
                  onClick={() => setRecent(removeRecentSearch(word))}
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Container>
  );
}

function SearchResults({ keyword }: { keyword: string }) {
  const products = useProducts({ keyword, size: 40 });
  return (
    <section aria-label={m.search_results()} className="pt-6">
      <p className="pb-4 text-meta text-sub">
        {m.search_result_count({ keyword, count: products.totalElements })}
      </p>
      {products.contents.length === 0 ? (
        <EmptyState message={m.search_empty()} />
      ) : (
        <ProductGrid products={products.contents} />
      )}
    </section>
  );
}
