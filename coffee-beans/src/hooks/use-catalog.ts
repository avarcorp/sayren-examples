import { useSuspenseQuery } from "@tanstack/react-query";
import {
  categoriesQuery,
  collectionProductsQuery,
  collectionQuery,
  collectionsQuery,
  type ProductSearch,
  productInquiriesQuery,
  productQuery,
  productReviewsQuery,
  productsQuery,
  storeQuery,
} from "../lib/queries";

/** 카탈로그 훅 — 라우트 loader가 같은 queryOptions로 `ensureQueryData`를 먼저 부른다(`loader-first`) */
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

export function useProductReviews(productId: string) {
  return useSuspenseQuery(productReviewsQuery(productId)).data;
}

export function useProductInquiries(productId: string) {
  return useSuspenseQuery(productInquiriesQuery(productId)).data;
}

export function useCollections() {
  return useSuspenseQuery(collectionsQuery()).data;
}

export function useCollection(slug: string) {
  return useSuspenseQuery(collectionQuery(slug)).data;
}

export function useCollectionProducts(slug: string) {
  return useSuspenseQuery(collectionProductsQuery(slug)).data;
}
