import { type CategoryNode, productSortSchema } from "@sayren/storefront-sdk";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useRouterState } from "@tanstack/react-router";
import { useQueryStates } from "nuqs";
import { ChipRow, chipClass } from "../components/browse/chips";
import { Pagination } from "../components/browse/pagination";
import { ProductResults, ResultBar } from "../components/browse/product-results";
import { SortControl } from "../components/browse/sort-control";
import type { NavLink } from "../components/site-header";
import { PageTitle } from "../components/ui/section";
import { m } from "../i18n";
import { useTrack } from "../lib/analytics";
import { categoriesQuery, productsQuery } from "../lib/catalog-queries";
import { pageTitle } from "../lib/page-title";
import {
  PRICE_LABELS,
  PRICE_RANGES,
  parseProductsSearch,
  productsSearchParams,
  SORT_LABELS,
  toSearchPage,
} from "../lib/products-search";
import { siteLayout } from "../site/layout";
import { isNavActive } from "../site/nav";

export const Route = createFileRoute("/products/")({
  // 목록·검색 조건은 URL에 둔다 — 읽는 규칙은 nuqs 파서 하나다(`lib/products-search.ts`)
  validateSearch: parseProductsSearch,
  // 검색은 검색 화면이 맡는다 — 옛 검색 주소(`/products?keyword=`)는 같은 조건의 `/search?q=`로 옮긴다
  beforeLoad: ({ search }) => {
    if (search.keyword) {
      throw redirect({ to: "/search", search: toSearchPage(search), statusCode: 301 });
    }
  },
  loaderDeps: ({ search }) => search,
  // 서버 렌더에서 미리 받아 쿼리 캐시에 넣는다. 화면은 같은 쿼리를 캐시에서 읽는다
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(productsQuery(deps)),
    ]),
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, m.products_title()) }] }),
  component: Products,
});

function findCategory(nodes: readonly CategoryNode[], id: string): CategoryNode | null {
  for (const node of nodes) {
    if (node.categoryId === id) return node;
    const found = findCategory(node.children, id);
    if (found) return found;
  }
  return null;
}

/**
 * 상품 목록 — 열 수·카드 모양·필터 위치는 `src/site/layout.json`의 `list`다.
 * top: 카테고리·가격 칩이 목록 위 · sidebar: 데스크톱은 카테고리가 왼쪽 열 · drawer: 칩을 「필터」 서랍에 접는다
 * 제목은 고른 카테고리 이름, 없으면 지금 켜진 헤더 메뉴(신상품·베스트) 이름이다.
 */
function Products() {
  const applied = Route.useSearch();
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { data: page } = useSuspenseQuery(productsQuery(applied));
  const location = useRouterState({ select: (state) => state.location });
  const nav = useRouterState({
    select: (state) => (state.matches[0]?.loaderData as { nav?: NavLink[] } | undefined)?.nav,
  });
  // 정렬을 바꾸면 URL만 고친다. 라우터가 바뀐 조건으로 loader를 다시 부른다
  const [, setSearch] = useQueryStates(productsSearchParams, { history: "push" });
  useTrack({
    name: "product_list_view",
    listId: applied.categoryId ? `category:${applied.categoryId}` : "all",
    productIds: page.contents.map((product) => product.productId),
  });

  const category = applied.categoryId ? findCategory(categories, applied.categoryId) : null;
  const title =
    category?.name ??
    nav?.find((item) => isNavActive(item.to, location))?.label ??
    m.products_title();
  const { filters } = siteLayout.list;

  const categoryLinks = (
    <>
      <Link
        from={Route.fullPath}
        to="/products"
        search={(prev) => ({ ...prev, categoryId: undefined, page: undefined })}
        className={chipClass(!applied.categoryId)}
      >
        {m.products_category_all()}
      </Link>
      {categories.map((node) => (
        <Link
          key={node.categoryId}
          from={Route.fullPath}
          to="/products"
          search={(prev) => ({ ...prev, categoryId: node.categoryId, page: undefined })}
          className={chipClass(applied.categoryId === node.categoryId)}
        >
          {node.name}
        </Link>
      ))}
    </>
  );
  const priceActive = (range: { minPrice?: number; maxPrice?: number }) =>
    applied.minPrice === range.minPrice && applied.maxPrice === range.maxPrice;
  // 가격 칩도 링크다 — 다른 조건은 그대로 두고 1페이지부터 다시 본다
  const priceLinks = (
    <>
      <Link
        to="/products"
        from={Route.fullPath}
        search={(prev) => ({ ...prev, minPrice: undefined, maxPrice: undefined, page: undefined })}
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
            to="/products"
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
    </>
  );
  const chips = (
    <div className="flex flex-col gap-2">
      <ChipRow label={m.products_category()}>{categoryLinks}</ChipRow>
      <ChipRow label={m.products_price_filter()}>{priceLinks}</ChipRow>
    </div>
  );
  const sort = (
    <SortControl
      options={productSortSchema.options.map((value) => ({ value, label: SORT_LABELS[value] }))}
      value={applied.sort ?? "recommend"}
      onChange={(next) => void setSearch({ sort: next, page: null })}
    />
  );
  const results = (
    <div className="flex min-w-0 flex-col gap-4">
      <ResultBar count={page.totalElements} sort={sort} />
      <ProductResults products={page.contents} empty={{ title: m.products_empty() }} />
      <Pagination
        page={page.page}
        totalPages={page.totalPages}
        renderLink={({ page: target, children, ...props }) => (
          <Link
            from={Route.fullPath}
            to="/products"
            search={(prev) => ({ ...prev, page: target > 1 ? target : undefined })}
            {...props}
          >
            {children}
          </Link>
        )}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <PageTitle>{title}</PageTitle>

      {filters === "top" ? chips : null}
      {filters === "drawer" ? (
        <details className="border border-line p-3">
          <summary className="cursor-pointer text-body">{m.products_filter()}</summary>
          <div className="mt-3">{chips}</div>
        </details>
      ) : null}

      {filters === "sidebar" ? (
        <div className="grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <nav
              aria-label={m.products_category()}
              className="hidden flex-col gap-2.5 text-body md:flex"
            >
              <Link
                from={Route.fullPath}
                to="/products"
                search={(prev) => ({ ...prev, categoryId: undefined, page: undefined })}
                className={applied.categoryId ? "text-sub hover:text-ink" : "font-bold"}
              >
                {m.products_category_all()}
              </Link>
              {categories.map((node) => (
                <Link
                  key={node.categoryId}
                  from={Route.fullPath}
                  to="/products"
                  search={(prev) => ({ ...prev, categoryId: node.categoryId, page: undefined })}
                  className={
                    applied.categoryId === node.categoryId ? "font-bold" : "text-sub hover:text-ink"
                  }
                >
                  {node.name}
                </Link>
              ))}
            </nav>
            <div className="md:hidden">{chips}</div>
            <div className="hidden md:block">
              <ChipRow label={m.products_price_filter()}>{priceLinks}</ChipRow>
            </div>
          </div>
          {results}
        </div>
      ) : (
        results
      )}
    </div>
  );
}
