import type { CategoryNode } from "@sayren/storefront-sdk";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi, notFound, useNavigate } from "@tanstack/react-router";
import { ProductListTemplate } from "../components/templates/product-list-template";
import { useTrack } from "../lib/analytics";
import { productListSearchSchema, productsQuery, SORTS } from "../lib/catalog";

const rootRoute = getRouteApi("__root__");
const PAGE_SIZE = 20;

export const Route = createFileRoute("/products/")({
  validateSearch: productListSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps, parentMatchPromise }) => {
    let top: CategoryNode | null = null;
    // 지운 카테고리 링크는 빈 전체 목록이 아니라 404다
    if (deps.categoryId) {
      const root = await parentMatchPromise;
      const tree = root.loaderData?.categories ?? [];
      if (!findNode(deps.categoryId, tree)) throw notFound();
      top = topOf(deps.categoryId, tree);
    }
    await Promise.all([
      context.queryClient.ensureQueryData(productsQuery({ ...deps, size: PAGE_SIZE })),
      // 칩의 수는 대분류 전체 기준이다(하위를 골라도 다른 칩의 수가 보인다)
      top && top.categoryId !== deps.categoryId
        ? context.queryClient.ensureQueryData(
            productsQuery({ categoryId: top.categoryId, size: 1 }),
          )
        : null,
    ]);
  },
  head: () => ({ meta: [{ title: "상품 | 설기로운" }] }),
  component: ProductList,
});

function ProductList() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/products/" });
  const tree = rootRoute.useLoaderData({ select: (d) => d.categories });
  const { data } = useSuspenseQuery(productsQuery({ ...search, size: PAGE_SIZE }));
  const top = topOf(search.categoryId, tree);
  const current = search.categoryId ? findNode(search.categoryId, tree) : null;
  const onTop = top?.categoryId === search.categoryId;
  const { data: topPage } = useQuery({
    ...productsQuery({ categoryId: top?.categoryId, size: 1 }),
    enabled: Boolean(top && !onTop),
  });
  const facets = (onTop ? data : topPage)?.facets?.categories ?? [];
  const countOf = (id: string) => facets.find((f) => f.categoryId === id)?.count ?? null;
  useTrack({
    name: "product_list_view",
    listId: search.categoryId ? `category:${search.categoryId}` : "all",
    productIds: data.contents.map((p) => p.productId),
  });
  const set = (patch: Partial<typeof search>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }) });

  return (
    <ProductListTemplate
      title={current?.name ?? "전체 상품"}
      chips={
        top
          ? [
              {
                categoryId: top.categoryId,
                label: "전체",
                count: onTop ? data.totalElements : (topPage?.totalElements ?? null),
              },
              ...top.children.map((c) => ({
                categoryId: c.categoryId,
                label: c.name,
                count: countOf(c.categoryId),
              })),
            ]
          : []
      }
      categoryId={search.categoryId}
      page={data}
      tree={tree}
      toolbar={{
        price: {
          value: { min: search.minPrice, max: search.maxPrice },
          range: data.facets?.priceRange,
          onChange: (v) => set({ minPrice: v.min, maxPrice: v.max }),
        },
        freeShipping: {
          checked: search.freeShipping ?? false,
          onChange: (checked) => set({ freeShipping: checked || undefined }),
        },
        sort: {
          value: search.sort ?? "recommend",
          options: SORTS,
          onChange: (sort) => set({ sort }),
        },
      }}
    />
  );
}

function findNode(id: string, tree: CategoryNode[]): CategoryNode | null {
  for (const n of tree) {
    if (n.categoryId === id) return n;
    const inner = findNode(id, n.children);
    if (inner) return inner;
  }
  return null;
}

/** 고른 카테고리가 속한 대분류 */
function topOf(id: string | undefined, tree: CategoryNode[]): CategoryNode | null {
  if (!id) return null;
  return tree.find((t) => t.categoryId === id || findNode(id, t.children)) ?? null;
}
