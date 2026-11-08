import { type ProductSort, productSortSchema } from "@sayren/storefront-sdk";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { FilterBar } from "../../components/filter-bar";
import { Pagination } from "../../components/pagination";
import { ProductGrid } from "../../components/product-card";
import { Container, EmptyState, PageTitle } from "../../components/ui";
import { useCategories, useProducts } from "../../hooks/use-catalog";
import { m } from "../../i18n";
import { categoriesQuery, productsQuery } from "../../lib/queries";

const searchSchema = z.object({
  category: z.string().optional(),
  sort: productSortSchema.optional(),
  page: z.number().int().min(1).optional(),
});

const PAGE_SIZE = 24;

/** 상품 목록 — 작은 제목 → 카테고리 칩·정렬 → 그리드(히어로·설명 없음). 필터는 URL에 둔다 */
export const Route = createFileRoute("/products/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        productsQuery({
          categoryId: deps.category,
          sort: deps.sort ?? "recommend",
          page: deps.page ?? 1,
          size: PAGE_SIZE,
        }),
      ),
      context.queryClient.ensureQueryData(categoriesQuery()),
    ]),
  component: ProductList,
});

function ProductList() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const categories = useCategories();
  const sort: ProductSort = search.sort ?? "recommend";
  const page = search.page ?? 1;
  const products = useProducts({ categoryId: search.category, sort, page, size: PAGE_SIZE });
  const current = categories.find((c) => c.categoryId === search.category);
  return (
    <Container className="flex flex-col gap-4 pt-5">
      <PageTitle>{current?.name ?? m.products_title()}</PageTitle>
      <FilterBar
        categories={categories}
        categoryId={search.category}
        sort={sort}
        onCategory={(category) => navigate({ search: { category, sort: search.sort } })}
        onSort={(next) => navigate({ search: { ...search, sort: next, page: undefined } })}
      />
      {products.contents.length === 0 ? (
        <EmptyState message={m.products_empty()} />
      ) : (
        <ProductGrid products={products.contents} eagerCount={4} />
      )}
      <Pagination
        page={page}
        totalPages={products.totalPages}
        onChange={(next) => navigate({ search: { ...search, page: next } })}
      />
    </Container>
  );
}
