import { collectionProductSortSchema } from "@sayren/storefront-sdk";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Pagination } from "../components/product/list-controls";
import { ProductGrid } from "../components/product/product-card";
import { EmptyState } from "../components/ui/empty-state";
import { Container, PageTitle } from "../components/ui/page-title";
import { useCollection } from "../hooks/use-catalog";
import { lazyMessages, m } from "../i18n";
import { collectionQuery } from "../lib/queries";

const searchSchema = z.object({
  sort: collectionProductSortSchema.optional(),
  page: z.number().int().min(1).optional(),
});

type CollectionSort = z.infer<typeof collectionProductSortSchema>;

const SORT_LABELS = lazyMessages<CollectionSort>({
  manual: () => m.sort_manual(),
  recommend: () => m.sort_recommend(),
  latest: () => m.sort_latest(),
  priceAsc: () => m.sort_price_asc(),
  priceDesc: () => m.sort_price_desc(),
  reviewCount: () => m.sort_review_count(),
  ratingDesc: () => m.sort_rating(),
});

export const Route = createFileRoute("/collections/$slug")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, params, deps }) => {
    const data = await context.queryClient.ensureQueryData(
      collectionQuery({ slug: params.slug, ...deps }),
    );
    if (!data) throw notFound();
    return data;
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const data = useCollection({ slug, ...search });
  if (!data) return null;
  const { collection, products } = data;
  const sort = (search.sort ?? collection.productSort) as CollectionSort;

  return (
    <Container>
      <PageTitle>{collection.title}</PageTitle>
      <div className="flex items-center justify-between gap-3 pb-4">
        <p className="text-meta text-sub">{m.list_total({ count: products.totalElements })}</p>
        <label className="flex items-center gap-2 text-meta">
          <span className="sr-only">{m.sort_label()}</span>
          <select
            value={sort}
            onChange={(event) =>
              navigate({ search: { sort: event.target.value as CollectionSort } })
            }
            className="min-h-10 border border-line-strong bg-page px-2 text-meta"
          >
            {(Object.keys(SORT_LABELS) as CollectionSort[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {products.contents.length === 0 ? (
        <EmptyState message={m.list_empty()} />
      ) : (
        <ProductGrid products={products.contents} eagerCount={4} />
      )}
      <Pagination
        page={search.page ?? 1}
        totalPages={products.totalPages}
        hrefFor={(p) => ({ search: { ...search, page: p } })}
      />
    </Container>
  );
}
