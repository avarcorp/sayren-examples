import { ApiError, productSortSchema } from "@sayren/storefront-sdk";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFor } from "./api.server";

/**
 * 카탈로그 조회 — TanStack Query의 queryOptions 팩토리다. 라우트 loader(`ensureQueryData`)와 화면(`useSuspenseQuery`, `src/hooks`)이
 * 같은 팩토리를 써서 queryKey가 갈라지지 않는다. 데이터는 서버 함수로 받는다(첫 요청은 서버가 받아 HTML에 싣는다).
 * 금액·재고·주문 가능 여부는 응답 값을 그대로 보인다 — 화면에서 계산하지 않는다.
 */

/** 없는 자원(404)은 null로 — 화면이 notFound로 바꾼다 */
async function orNull<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

const getStore = createServerFn({ method: "GET" }).handler(() => apiFor().store.get());

const listCategories = createServerFn({ method: "GET" }).handler(() =>
  apiFor().catalog.listCategories(),
);

export const productSearchSchema = z.object({
  keyword: z.string().optional(),
  categoryId: z.string().optional(),
  sort: productSortSchema.optional(),
  page: z.number().int().min(1).optional(),
  size: z.number().int().min(1).max(60).optional(),
});
export type ProductSearch = z.infer<typeof productSearchSchema>;

const searchProducts = createServerFn({ method: "GET" })
  .validator(productSearchSchema)
  .handler(({ data }) =>
    apiFor().catalog.searchProducts({ ...data, page: data.page ?? 1, size: data.size ?? 24 }),
  );

const productIdSchema = z.object({ productId: z.string().min(1) });

/** 상품 하나 — 없으면 null(화면이 notFound로 바꾼다) */
const getProduct = createServerFn({ method: "GET" })
  .validator(productIdSchema)
  .handler(({ data }) => orNull(() => apiFor().catalog.getProduct(data.productId)));

const listProductReviews = createServerFn({ method: "GET" })
  .validator(productIdSchema)
  .handler(({ data }) =>
    apiFor().catalog.listProductReviews(data.productId, { page: 1, size: 20, sort: "latest" }),
  );

const listProductInquiries = createServerFn({ method: "GET" })
  .validator(productIdSchema)
  .handler(({ data }) =>
    apiFor().catalog.listProductInquiries(data.productId, { page: 1, size: 20 }),
  );

const listCollections = createServerFn({ method: "GET" }).handler(() =>
  apiFor().catalog.listCollections({ page: 1, size: 20 }),
);

const slugSchema = z.object({ slug: z.string().min(1) });

const getCollection = createServerFn({ method: "GET" })
  .validator(slugSchema)
  .handler(({ data }) => orNull(() => apiFor().catalog.getCollection(data.slug)));

const listCollectionProducts = createServerFn({ method: "GET" })
  .validator(slugSchema)
  .handler(({ data }) => apiFor().catalog.listCollectionProducts(data.slug, { page: 1, size: 48 }));

/** 상점 이름·연락처·사업자 정보·주문 가능 여부 */
export const storeQuery = () =>
  queryOptions({ queryKey: ["store"], queryFn: () => getStore(), staleTime: 5 * 60_000 });

/** 카테고리는 자주 바뀌지 않는다 — 5분 동안 다시 받지 않는다 */
export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["catalog", "categories"],
    queryFn: () => listCategories(),
    staleTime: 5 * 60_000,
  });

export const productsQuery = (search: ProductSearch) =>
  queryOptions({
    queryKey: ["catalog", "products", search],
    queryFn: () => searchProducts({ data: search }),
  });

/** 상품 하나 — 상품 id 또는 상점별 상품번호 */
export const productQuery = (productId: string) =>
  queryOptions({
    queryKey: ["catalog", "product", productId],
    queryFn: () => getProduct({ data: { productId } }),
  });

export const productReviewsQuery = (productId: string) =>
  queryOptions({
    queryKey: ["catalog", "product", productId, "reviews"],
    queryFn: () => listProductReviews({ data: { productId } }),
  });

export const productInquiriesQuery = (productId: string) =>
  queryOptions({
    queryKey: ["catalog", "product", productId, "inquiries"],
    queryFn: () => listProductInquiries({ data: { productId } }),
  });

export const collectionsQuery = () =>
  queryOptions({
    queryKey: ["catalog", "collections"],
    queryFn: () => listCollections(),
    staleTime: 5 * 60_000,
  });

export const collectionQuery = (slug: string) =>
  queryOptions({
    queryKey: ["catalog", "collection", slug],
    queryFn: () => getCollection({ data: { slug } }),
  });

export const collectionProductsQuery = (slug: string) =>
  queryOptions({
    queryKey: ["catalog", "collection", slug, "products"],
    queryFn: () => listCollectionProducts({ data: { slug } }),
  });
