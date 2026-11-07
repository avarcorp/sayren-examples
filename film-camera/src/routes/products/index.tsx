import { type ProductSort, productSortSchema } from "@sayren/storefront-sdk";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { FilterChips } from "../../components/filter-chips";
import { Pagination } from "../../components/pagination";
import { ProductGrid } from "../../components/product-card";
import { EmptyState, PageHeader } from "../../components/ui";
import { useCategories } from "../../hooks/use-catalog";
import { lazyMessages, m } from "../../i18n";
import { productsQuery } from "../../lib/queries";

const PAGE_SIZE = 24;
const SORTS = ["latest", "priceAsc", "priceDesc"] as const satisfies readonly ProductSort[];
const SORT_LABELS = lazyMessages<(typeof SORTS)[number]>({
  latest: () => m.sort_latest(),
  priceAsc: () => m.sort_priceAsc(),
  priceDesc: () => m.sort_priceDesc(),
});

const searchSchema = z.object({
  category: z.string().optional(),
  sort: productSortSchema.optional().catch(undefined),
  page: z.number().int().min(1).optional().catch(undefined),
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
  component: Products,
});

function Products() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/products/" });
  const categories = useCategories();
  const sort = search.sort ?? "latest";
  const page = search.page ?? 1;
  const products = useSuspenseQuery(
    productsQuery({ categoryId: search.category, sort, page, size: PAGE_SIZE }),
  ).data;
  const current = categories.find((c) => c.categoryId === search.category);

  return (
    <main className="flex flex-col gap-6">
      <PageHeader title={current?.name ?? m.products_title()} />
      <FilterChips
        label={m.nav_categories()}
        chips={[
          {
            key: "all",
            label: m.products_all(),
            active: !search.category,
            link: { to: "/products" as const, search: { sort: search.sort } },
          },
          ...categories.map((c) => ({
            key: c.categoryId,
            label: c.name,
            active: c.categoryId === search.category,
            link: {
              to: "/products" as const,
              search: { category: c.categoryId, sort: search.sort },
            },
          })),
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <p className="tabular text-body text-sub">
          {m.products_count({ count: products.totalElements })}
        </p>
        <label className="flex items-center gap-2 text-body">
          <span className="sr-only">{m.sort_label()}</span>
          <select
            value={sort}
            onChange={(event) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  sort: event.target.value as ProductSort,
                  page: undefined,
                }),
              })
            }
            className="min-h-11 border border-line-strong bg-page px-3 text-body"
          >
            {SORTS.map((value) => (
              <option key={value} value={value}>
                {SORT_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {products.contents.length > 0 ? (
        <ProductGrid products={products.contents} />
      ) : (
        <EmptyState message={m.products_empty()} />
      )}
      <Pagination
        page={page}
        totalPages={products.totalPages}
        linkFor={(p) => ({ to: "/products", search: { ...search, page: p } })}
      />
    </main>
  );
}
