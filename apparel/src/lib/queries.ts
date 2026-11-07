import {
  collectionProductSortSchema,
  deliveryNoticeOf,
  productSortSchema,
} from "@sayren/storefront-sdk";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFor } from "./api.server";
import { notFoundAsNull } from "./api-errors";

/**
 * 카탈로그 조회 — TanStack Query의 queryOptions 팩토리다. 라우트 loader(`ensureQueryData`)와 화면(`useSuspenseQuery`)이
 * 같은 팩토리를 써서 queryKey가 갈라지지 않는다. 데이터는 서버 함수로 받는다.
 * 금액·재고·주문 가능 여부는 응답 값을 그대로 보인다 — 화면에서 계산하지 않는다.
 */

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

const getProduct = createServerFn({ method: "GET" })
  .validator(z.object({ productId: z.string().min(1) }))
  .handler(({ data }) => notFoundAsNull(apiFor().catalog.getProduct(data.productId)));

const getProductExtras = createServerFn({ method: "GET" })
  .validator(z.object({ productId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const api = apiFor();
    const [reviews, inquiries] = await Promise.all([
      api.catalog.listProductReviews(data.productId, { sort: "latest", size: 5 }).catch(() => null),
      api.catalog.listProductInquiries(data.productId, { page: 1, size: 5 }).catch(() => null),
    ]);
    return { reviews, inquiries };
  });

const listCollections = createServerFn({ method: "GET" }).handler(() =>
  apiFor().catalog.listCollections({ page: 1, size: 20 }),
);

const collectionSearchSchema = z.object({
  slug: z.string().min(1),
  sort: collectionProductSortSchema.optional(),
  page: z.number().int().min(1).optional(),
});

const getCollection = createServerFn({ method: "GET" })
  .validator(collectionSearchSchema)
  .handler(async ({ data }) => {
    const api = apiFor();
    const collection = await notFoundAsNull(api.catalog.getCollection(data.slug));
    if (!collection) return null;
    const products = await api.catalog.listCollectionProducts(data.slug, {
      sort: data.sort,
      page: data.page ?? 1,
      size: 24,
    });
    return { collection, products };
  });

/** 홈 상단 띠 — 목록 첫 컬렉션의 대표 이미지와 제목. 이미지가 없으면 null(띠를 숨긴다) */
const getHomeBanner = createServerFn({ method: "GET" }).handler(async () => {
  const { contents } = await apiFor().catalog.listCollections({ page: 1, size: 1 });
  const first = contents[0];
  return first?.imageUrl
    ? { imageUrl: first.imageUrl, slug: first.slug, title: first.title }
    : null;
});

/**
 * 상점 배송 안내(띠 공지·도움말) — 스토어프론트 상점 응답에는 배송 정책이 없다. 상점 기본 정책이 반영된 첫 판매 상품의
 * `fulfillment`를 `deliveryNoticeOf`로 읽는다. 상품이 없으면 null(띠 공지를 숨긴다)
 */
const getShippingNotice = createServerFn({ method: "GET" }).handler(async () => {
  const api = apiFor();
  const first = (await api.catalog.searchProducts({ page: 1, size: 1 })).contents[0];
  const product = first ? await notFoundAsNull(api.catalog.getProduct(first.productId)) : null;
  if (!product) return null;
  const notice = deliveryNoticeOf(product.fulfillment);
  const shipping = product.fulfillment.type === "SHIPPING" ? product.fulfillment.shipping : null;
  return {
    notice,
    currency: product.currency,
    returnDeliveryFee: shipping?.returnDeliveryFee ?? null,
    exchangeDeliveryFee: shipping?.exchangeDeliveryFee ?? null,
    returnPeriodDays: product.returnPeriodDays,
  };
});

export const shippingNoticeQuery = () =>
  queryOptions({
    queryKey: ["store", "shipping-notice"],
    queryFn: () => getShippingNotice(),
    staleTime: 5 * 60_000,
  });

/** 상점 이름·로고·연락처·주문 가능 여부 — 상점 플랫폼 설정 › 상점 정보 값 */
export const storeQuery = () =>
  queryOptions({ queryKey: ["store"], queryFn: () => getStore(), staleTime: 5 * 60_000 });

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

/** 상품 하나 — 상품번호 또는 상품 id. 없으면 null */
export const productQuery = (productId: string) =>
  queryOptions({
    queryKey: ["catalog", "product", productId],
    queryFn: () => getProduct({ data: { productId } }),
  });

/** 상세 보조 구획(리뷰·문의) — 실패하면 각 구획을 숨긴다 */
export const productExtrasQuery = (productId: string) =>
  queryOptions({
    queryKey: ["catalog", "product-extras", productId],
    queryFn: () => getProductExtras({ data: { productId } }),
  });

export const collectionsQuery = () =>
  queryOptions({
    queryKey: ["catalog", "collections"],
    queryFn: () => listCollections(),
    staleTime: 5 * 60_000,
  });

export const collectionQuery = (search: z.infer<typeof collectionSearchSchema>) =>
  queryOptions({
    queryKey: ["catalog", "collection", search],
    queryFn: () => getCollection({ data: search }),
  });

export const homeBannerQuery = () =>
  queryOptions({
    queryKey: ["catalog", "home-banner"],
    queryFn: () => getHomeBanner(),
    staleTime: 5 * 60_000,
  });
