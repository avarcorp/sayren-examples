import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { z } from "zod";
import { ProductGrid } from "../components/product-card";
import { Button, EmptyState, PageHeader } from "../components/ui";
import { m } from "../i18n";
import { productsQuery } from "../lib/queries";
import { pushRecentSearch, readRecentSearches, writeRecentSearches } from "../lib/recent-searches";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ q: search.q?.trim() ?? "" }),
  loader: ({ context, deps }) =>
    deps.q
      ? context.queryClient.ensureQueryData(productsQuery({ keyword: deps.q, size: 48 }))
      : null,
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const keyword = q?.trim() ?? "";
  const navigate = useNavigate({ from: "/search" });
  const [draft, setDraft] = useState(keyword);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(keyword ? pushRecentSearch(keyword) : readRecentSearches());
  }, [keyword]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = draft.trim();
    if (next) navigate({ search: { q: next } });
  };

  const remove = (word: string) => {
    const next = recent.filter((k) => k !== word);
    writeRecentSearches(next);
    setRecent(next);
  };

  return (
    <main className="flex flex-col gap-6">
      <PageHeader title={m.search_title()} />
      <search>
        <form onSubmit={submit} className="flex gap-2">
          <label htmlFor="search-q" className="sr-only">
            {m.search_label()}
          </label>
          <input
            id="search-q"
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={m.search_placeholder()}
            className="min-h-12 min-w-0 flex-1 rounded-control border border-line-strong px-3 text-body-lg focus:border-ink focus:outline-2 focus:outline-point"
          />
          <Button type="submit">{m.search_submit()}</Button>
        </form>
      </search>
      {recent.length > 0 ? (
        <section aria-labelledby="recent-title" className="flex flex-col gap-2">
          <h2 id="recent-title" className="font-semibold text-meta text-sub">
            {m.search_recent()}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {recent.map((word) => (
              <li key={word} className="flex items-center border border-line">
                <Link
                  to="/search"
                  search={{ q: word }}
                  className="flex min-h-11 items-center pl-3 text-body"
                >
                  {word}
                </Link>
                <button
                  type="button"
                  onClick={() => remove(word)}
                  aria-label={m.search_recent_remove({ keyword: word })}
                  className="inline-flex size-11 items-center justify-center text-muted hover:text-ink"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {keyword ? (
        <SearchResults keyword={keyword} />
      ) : (
        <p className="text-body text-sub">{m.search_hint()}</p>
      )}
    </main>
  );
}

function SearchResults({ keyword }: { keyword: string }) {
  const result = useSuspenseQuery(productsQuery({ keyword, size: 48 })).data;
  if (result.contents.length === 0) return <EmptyState message={m.search_empty({ keyword })} />;
  return (
    <section className="flex flex-col gap-4">
      <p className="text-body text-sub">
        {m.search_result({ keyword, count: result.totalElements })}
      </p>
      <ProductGrid products={result.contents} />
    </section>
  );
}
