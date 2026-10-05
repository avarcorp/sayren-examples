import { ApiError, collectionProductSortSchema, productSortSchema } from "@sayren/storefront-sdk";
import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFor } from "./api.server";
import type { CollectionSearch } from "./collection-search";
import type { ProductsSearch } from "./products-search";

/**
 * 카탈로그 쿼리 — TanStack Query의 queryOptions 팩토리다. 라우트 loader(`ensureQueryData`)와 화면
 * (`useSuspenseQuery`)이 같은 팩토리를 써서 queryKey가 갈라지지 않는다.
 *
 * 데이터는 서버 함수로 받는다. 첫 요청은 서버가 받아 HTML에 실어 보내고(SSR 하이드레이션), 이후 이동은 브라우저가
 * 같은 서버 함수를 부른다. 한 번 받은 조건은 캐시에서 바로 그려 뒤로가기가 빠르다.
 */

const PRODUCTS_PAGE_SIZE = 24;

const searchProductsInput = z.object({
  keyword: z.string().optional(),
  categoryId: z.string().optional(),
  sort: productSortSchema.optional(),
  page: z.number().int().min(1).optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).optional(),
});

const searchProducts = createServerFn({ method: "GET" })
  .validator(searchProductsInput)
  .handler(({ data }) =>
    apiFor().catalog.searchProducts({ ...data, page: data.page ?? 1, size: PRODUCTS_PAGE_SIZE }),
  );

const listCategories = createServerFn({ method: "GET" }).handler(() =>
  apiFor().catalog.listCategories(),
);

/** 카테고리는 자주 바뀌지 않는다 — 화면을 옮겨도 5분 동안 다시 받지 않는다 */
export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["catalog", "categories"],
    queryFn: () => listCategories(),
    staleTime: 5 * 60_000,
  });

export const productsQuery = (search: ProductsSearch) =>
  queryOptions({
    queryKey: ["catalog", "products", search],
    queryFn: () => searchProducts({ data: search }),
  });

// ── 컬렉션(이슈 #83) ──────────────────────────────────────

const COLLECTION_PRODUCTS_PAGE_SIZE = 24;
const COLLECTIONS_PAGE_SIZE = 60;

/** 없음·숨김·기간 밖은 모두 404 `COLLECTION_NOT_FOUND`다 — 사이트의 없는 화면으로 그린다 */
function notFoundOn404(error: unknown): never {
  if (error instanceof ApiError && error.status === 404) throw notFound();
  throw error;
}

const getCollection = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(({ data }) => apiFor().catalog.getCollection(data.slug).catch(notFoundOn404));

const listCollectionProducts = createServerFn({ method: "GET" })
  .validator(
    z.object({
      slug: z.string(),
      sort: collectionProductSortSchema.optional(),
      page: z.number().int().min(1).optional(),
    }),
  )
  .handler(({ data }) =>
    apiFor()
      .catalog.listCollectionProducts(data.slug, {
        sort: data.sort,
        page: data.page ?? 1,
        size: COLLECTION_PRODUCTS_PAGE_SIZE,
      })
      .catch(notFoundOn404),
  );

const listCollections = createServerFn({ method: "GET" }).handler(() =>
  apiFor().catalog.listCollections({ size: COLLECTIONS_PAGE_SIZE }),
);

export const collectionQuery = (slug: string) =>
  queryOptions({
    queryKey: ["catalog", "collection", slug],
    queryFn: () => getCollection({ data: { slug } }),
  });

export const collectionProductsQuery = (slug: string, search: CollectionSearch) =>
  queryOptions({
    queryKey: ["catalog", "collection", slug, "products", search],
    queryFn: () => listCollectionProducts({ data: { slug, ...search } }),
  });

/** 노출 중인 컬렉션(셀러가 지정한 순서) — 첫 페이지만 쓴다 */
export const collectionsQuery = () =>
  queryOptions({
    queryKey: ["catalog", "collections"],
    queryFn: () => listCollections(),
  });
