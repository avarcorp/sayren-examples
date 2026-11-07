import { useSuspenseQuery } from "@tanstack/react-query";
import {
  categoriesQuery,
  collectionQuery,
  collectionsQuery,
  homeBannerQuery,
  type ProductSearch,
  productExtrasQuery,
  productQuery,
  productsQuery,
  shippingNoticeQuery,
  storeQuery,
} from "../lib/queries";

/**
 * 카탈로그 훅 — 화면은 이 훅으로 데이터를 읽는다. 라우트 loader에서 같은 queryOptions로 `ensureQueryData`를 먼저 부른다.
 */
export function useStore() {
  return useSuspenseQuery(storeQuery()).data;
}

export function useCategories() {
  return useSuspenseQuery(categoriesQuery()).data;
}

export function useProducts(search: ProductSearch = {}) {
  return useSuspenseQuery(productsQuery(search)).data;
}

export function useProduct(productId: string) {
  return useSuspenseQuery(productQuery(productId)).data;
}

export function useProductExtras(productId: string) {
  return useSuspenseQuery(productExtrasQuery(productId)).data;
}

export function useCollections() {
  return useSuspenseQuery(collectionsQuery()).data;
}

export function useCollection(search: Parameters<typeof collectionQuery>[0]) {
  return useSuspenseQuery(collectionQuery(search)).data;
}

export function useHomeBanner() {
  return useSuspenseQuery(homeBannerQuery()).data;
}

export function useShippingNotice() {
  return useSuspenseQuery(shippingNoticeQuery()).data;
}
