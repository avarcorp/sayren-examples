import { productSortSchema } from "@sayren/storefront-sdk";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { CategoryChips, Pagination, SortSelect } from "../components/product/list-controls";
import { ProductGrid } from "../components/product/product-card";
import { EmptyState } from "../components/ui/empty-state";
import { Container, PageTitle } from "../components/ui/page-title";
import { useCategories, useProducts } from "../hooks/use-catalog";
import { m } from "../i18n";
import { productsQuery } from "../lib/queries";

const PAGE_SIZE = 24;

/** 목록 상태는 URL에 둔다 — 새로고침·공유해도 같은 목록이다 */
const searchSchema = z.object({
  category: z.string().optional(),
  sort: productSortSchema.optional(),
  page: z.number().int().min(1).optional(),
});

export const Route = createFileRoute("/products/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      productsQuery({
        categoryId: deps.category,
        sort: deps.sort ?? "latest",
        page: deps.page ?? 1,
        size: PAGE_SIZE,
      }),
    ),
  component: ProductList,
});

function ProductList() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const categories = useCategories();
  const sort = search.sort ?? "latest";
  const page = search.page ?? 1;
  const products = useProducts({ categoryId: search.category, sort, page, size: PAGE_SIZE });
  const current = categories.find((c) => c.categoryId === search.category);

  return (
    <Container>
      <PageTitle>{current?.name ?? m.list_all_title()}</PageTitle>
      <CategoryChips
        categories={categories}
        current={search.category}
        onSelect={(category) => navigate({ search: { category, sort: search.sort } })}
      />
      <SortSelect
        value={sort}
        total={products.totalElements}
        onChange={(next) => navigate({ search: { ...search, sort: next, page: undefined } })}
      />
      {products.contents.length === 0 ? (
        <EmptyState message={m.list_empty()} />
      ) : (
        <ProductGrid products={products.contents} eagerCount={4} />
      )}
      <Pagination
        page={page}
        totalPages={products.totalPages}
        hrefFor={(p) => ({ search: { ...search, page: p } })}
      />
    </Container>
  );
}
