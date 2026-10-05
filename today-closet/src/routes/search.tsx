import type { CategoryNode } from "@sayren/storefront-sdk";
import { productSortSchema } from "@sayren/storefront-sdk";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, CircleX, Search as SearchIcon, X } from "lucide-react";
import { useQueryStates } from "nuqs";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { ChipCount, ChipDivider, ChipRow, chipClass } from "../components/browse/chips";
import { Pagination } from "../components/browse/pagination";
import { ProductResults, ResultBar } from "../components/browse/product-results";
import { useRecentSearches } from "../components/browse/recent-searches";
import { SortControl } from "../components/browse/sort-control";
import { m } from "../i18n";
import { useTrack } from "../lib/analytics";
import { categoriesQuery, productsQuery } from "../lib/catalog-queries";
import { pageTitle } from "../lib/page-title";
import {
  PRICE_LABELS,
  PRICE_RANGES,
  parseSearchPage,
  type SearchPageSearch,
  SORT_LABELS,
  searchPageParams,
  toProductsSearch,
} from "../lib/products-search";
import { SEARCH_SUGGESTIONS } from "../site/search";

/** 카테고리 칩의 개수 — 서버 패싯은 고른 필터 안에서 센다. 카테고리를 골랐으면 카테고리만 뺀 조건으로 다시 센다 */
function facetSearch(search: SearchPageSearch): SearchPageSearch | null {
  if (!search.q || !search.categoryId) return null;
  return { q: search.q, minPrice: search.minPrice, maxPrice: search.maxPrice };
}

export const Route = createFileRoute("/search")({
  // 검색 조건은 URL에 둔다 — `q` + 상품 목록과 같은 카테고리·정렬·가격·페이지(`lib/products-search.ts`)
  validateSearch: parseSearchPage,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    const facets = facetSearch(deps);
    return Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery()),
      deps.q ? context.queryClient.ensureQueryData(productsQuery(toProductsSearch(deps))) : null,
      facets ? context.queryClient.ensureQueryData(productsQuery(toProductsSearch(facets))) : null,
    ]);
  },
  head: ({ matches, match }) => ({
    meta: [
      {
        title: pageTitle(
          matches,
          match.search.q ? m.search_result_heading({ q: match.search.q }) : m.search_title(),
        ),
      },
    ],
  }),
  component: SearchPage,
});

/**
 * 상품 검색 — 검색어가 없으면 최근·추천 검색어와 카테고리 바로가기, 있으면 결과(카테고리·가격 칩, 정렬, 격자, 페이지).
 * 모바일은 사이트 헤더 대신 화면 맨 위의 검색 줄(뒤로·입력·검색)이 붙어 있다.
 * 인기 검색어·자동완성은 스토어프론트 API가 없어 셀러가 고른 추천 검색어(`src/site/search.ts`)만 보인다.
 */
function SearchPage() {
  const applied = Route.useSearch();
  const recent = useRecentSearches();
  const { add } = recent;
  useEffect(() => {
    if (applied.q) add(applied.q);
  }, [applied.q, add]);

  return (
    <div className="flex flex-col gap-6 md:gap-9">
      <div className="flex flex-col gap-5">
        <SearchBar key={applied.q ?? ""} q={applied.q} autoFocus={!applied.q} />
        {applied.q ? (
          <div className="hidden items-center justify-center gap-2 text-meta text-muted md:flex">
            {m.search_suggested_title()}
            <SuggestionChips />
          </div>
        ) : null}
      </div>
      {applied.q ? <Results q={applied.q} /> : <Landing recent={recent} />}
    </div>
  );
}

function SearchBar({ q, autoFocus }: { q?: string; autoFocus: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(q ?? "");
  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);
  const iconButton = "flex size-11 shrink-0 items-center justify-center";
  return (
    <search className="-mx-4 -mt-8 sticky top-0 z-30 flex h-14 items-center gap-1 border-ink border-b bg-page px-2 md:static md:mx-auto md:mt-0 md:h-15 md:w-full md:max-w-[40rem] md:border-b-2 md:px-0">
      <button
        type="button"
        aria-label={m.site_header_back()}
        onClick={() =>
          window.history.length > 1 ? router.history.back() : router.navigate({ to: "/" })
        }
        className={`${iconButton} md:hidden`}
      >
        <ChevronLeft aria-hidden="true" className="size-5.5" strokeWidth={1.6} />
      </button>
      {/* 하이드레이션 전에는 GET 폼으로 제출되고, 뒤에는 화면을 새로 그리지 않고 이동한다. 새 검색은 조건을 비운다 */}
      <form
        action="/search"
        method="get"
        className="flex min-w-0 flex-1 items-center"
        onSubmit={(event) => {
          event.preventDefault();
          const next = value.trim();
          input.current?.blur();
          void router.navigate({ to: "/search", search: next ? { q: next } : {} });
        }}
      >
        <input
          ref={input}
          type="search"
          name="q"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label={m.search_input_label()}
          placeholder={m.site_header_search_placeholder()}
          enterKeyHint="search"
          className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:font-normal placeholder:text-muted md:font-bold md:text-[1.375rem] [&::-webkit-search-cancel-button]:hidden"
        />
        {value ? (
          <button
            type="button"
            aria-label={m.search_clear()}
            onClick={() => {
              setValue("");
              input.current?.focus();
            }}
            className={`${iconButton} text-line-strong hover:text-muted`}
          >
            <CircleX aria-hidden="true" className="size-5" strokeWidth={1.6} />
          </button>
        ) : null}
        <button type="submit" aria-label={m.products_search_submit()} className={iconButton}>
          <SearchIcon aria-hidden="true" className="size-5.5 md:size-6.5" strokeWidth={1.6} />
        </button>
      </form>
    </search>
  );
}

function SuggestionChips() {
  return (
    <div className="flex flex-wrap gap-2">
      {SEARCH_SUGGESTIONS.map((keyword) => (
        <Link key={keyword} to="/search" search={{ q: keyword }} className={chipClass(false)}>
          {keyword}
        </Link>
      ))}
    </div>
  );
}

function LandingSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-bold text-body-lg">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** 검색어가 없을 때 — 최근 검색어(이 브라우저) · 추천 검색어 · 카테고리 */
function Landing({ recent }: { recent: ReturnType<typeof useRecentSearches> }) {
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  return (
    <div className="mx-auto flex w-full max-w-[40rem] flex-col gap-8">
      <LandingSection
        title={m.search_recent_title()}
        action={
          recent.items.length ? (
            <button
              type="button"
              onClick={recent.clear}
              className="py-1.5 text-caption text-muted hover:text-ink"
            >
              {m.search_recent_clear_all()}
            </button>
          ) : null
        }
      >
        {recent.items.length ? (
          <ul className="flex flex-wrap gap-2">
            {recent.items.map((keyword) => (
              <li key={keyword} className={`${chipClass(false)} pr-2`}>
                <Link to="/search" search={{ q: keyword }} className="max-w-[12rem] truncate">
                  {keyword}
                </Link>
                <button
                  type="button"
                  aria-label={m.search_recent_remove({ keyword })}
                  onClick={() => recent.remove(keyword)}
                  className="-my-1 flex size-6 items-center justify-center text-muted hover:text-ink"
                >
                  <X aria-hidden="true" className="size-3.5" strokeWidth={1.6} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-meta text-muted">{m.search_recent_empty()}</p>
        )}
      </LandingSection>

      <LandingSection title={m.search_suggested_title()}>
        <SuggestionChips />
      </LandingSection>

      {categories.length ? (
        <>
          <div className="-mx-4 h-2 bg-chip md:hidden" />
          <LandingSection title={m.search_categories_title()}>
            <CategoryShortcuts categories={categories} />
          </LandingSection>
        </>
      ) : null}
    </div>
  );
}

function CategoryShortcuts({ categories }: { categories: readonly CategoryNode[] }) {
  return (
    <nav
      aria-label={m.search_categories_title()}
      className="grid grid-cols-2 gap-x-4 border-line border-t text-body md:grid-cols-4"
    >
      {categories.map((category) => (
        <Link
          key={category.categoryId}
          to="/products"
          search={{ categoryId: category.categoryId }}
          className="min-w-0 truncate border-line border-b py-3.5 hover:text-sub"
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );
}

/** 검색 결과 — 「'q' 검색 결과 N개」 · 카테고리·가격 칩 · 정렬 · 격자 · 페이지 */
function Results({ q }: { q: string }) {
  const applied = Route.useSearch();
  const { data: page } = useSuspenseQuery(productsQuery(toProductsSearch(applied)));
  const facetBase = facetSearch(applied);
  // 카테고리를 골랐을 때만 따로 센다(loader가 미리 받아 둔다). 고르지 않았으면 결과의 패싯이 그대로다
  const { data: facetPage } = useQuery({
    ...productsQuery(toProductsSearch(facetBase ?? applied)),
    enabled: facetBase !== null,
  });
  const facets = (facetBase ? facetPage : page)?.facets;
  const [, setSearch] = useQueryStates(searchPageParams, { history: "push" });

  useTrack({ name: "search", query: q, resultCount: page.totalElements });
  useTrack({
    name: "product_list_view",
    listId: "search",
    productIds: page.contents.map((product) => product.productId),
  });

  const sortOptions = productSortSchema.options.map((value) => ({
    value,
    label: SORT_LABELS[value],
  }));
  const sort = (
    <SortControl
      options={sortOptions}
      value={applied.sort ?? "recommend"}
      onChange={(next) => void setSearch({ sort: next, page: null })}
    />
  );
  const facetCategories = facets?.categories ?? [];
  const facetTotal = facetBase ? (facetPage?.totalElements ?? null) : page.totalElements;
  const priceActive = (range: { minPrice?: number; maxPrice?: number }) =>
    applied.minPrice === range.minPrice && applied.maxPrice === range.maxPrice;

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <div className="flex min-w-0 items-end justify-between gap-4 md:border-ink md:border-b md:pb-3.5">
        <h1 className="min-w-0 break-words font-bold text-body-lg md:text-xl">
          {m.search_result_heading({ q })}{" "}
          <span className="text-point">{page.totalElements.toLocaleString("ko-KR")}</span>
          {m.search_result_unit()}
        </h1>
        <div className="hidden shrink-0 md:block">{sort}</div>
      </div>

      <ChipRow label={m.search_filter_category()}>
        {facetCategories.length ? (
          <>
            <Link
              from={Route.fullPath}
              to="/search"
              search={(prev) => ({ ...prev, categoryId: undefined, page: undefined })}
              className={chipClass(!applied.categoryId)}
            >
              {m.products_category_all()}
              {facetTotal != null ? (
                <ChipCount count={facetTotal} active={!applied.categoryId} />
              ) : null}
            </Link>
            {facetCategories.map((category) => {
              const active = applied.categoryId === category.categoryId;
              return (
                <Link
                  key={category.categoryId}
                  from={Route.fullPath}
                  to="/search"
                  search={(prev) => ({ ...prev, categoryId: category.categoryId, page: undefined })}
                  className={chipClass(active)}
                >
                  {category.name}
                  <ChipCount count={category.count} active={active} />
                </Link>
              );
            })}
            <ChipDivider />
          </>
        ) : null}
        <Link
          from={Route.fullPath}
          to="/search"
          search={(prev) => ({
            ...prev,
            minPrice: undefined,
            maxPrice: undefined,
            page: undefined,
          })}
          className={chipClass(!applied.minPrice && !applied.maxPrice)}
        >
          {m.products_price_all()}
        </Link>
        {PRICE_RANGES.map((range) => {
          const bounds = range as { minPrice?: number; maxPrice?: number };
          return (
            <Link
              key={range.key}
              from={Route.fullPath}
              to="/search"
              search={(prev) => ({
                ...prev,
                minPrice: bounds.minPrice,
                maxPrice: bounds.maxPrice,
                page: undefined,
              })}
              className={chipClass(priceActive(bounds))}
            >
              {PRICE_LABELS[range.key]}
            </Link>
          );
        })}
      </ChipRow>

      <div className="md:hidden">
        <ResultBar count={page.totalElements} sort={sort} />
      </div>

      <ProductResults
        products={page.contents}
        empty={{
          title: m.search_empty_title({ q }),
          description: m.search_empty_description(),
          action: <SuggestionChips />,
        }}
      />

      <Pagination
        page={page.page}
        totalPages={page.totalPages}
        renderLink={({ page: target, children, ...props }) => (
          <Link
            from={Route.fullPath}
            to="/search"
            search={(prev) => ({ ...prev, page: target > 1 ? target : undefined })}
            {...props}
          >
            {children}
          </Link>
        )}
      />
    </div>
  );
}
