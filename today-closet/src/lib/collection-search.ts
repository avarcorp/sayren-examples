import {
  type CollectionProductSortParam,
  collectionProductSortSchema,
} from "@sayren/storefront-sdk";
import { createLoader, parseAsInteger, parseAsStringLiteral } from "nuqs";
import { lazyMessages, m } from "../i18n";

/**
 * 컬렉션 화면(`/collections/$slug`)의 URL 상태(정렬·페이지) — 상품 목록(`products-search.ts`)과 같은 nuqs 파서 방식이다.
 * 정렬을 주소에 싣지 않으면 셀러가 컬렉션에 지정한 기본 정렬이다(서버가 `sort` 생략을 그렇게 읽는다).
 */
export const collectionSearchParams = {
  sort: parseAsStringLiteral(collectionProductSortSchema.options),
  page: parseAsInteger.withDefault(1),
};

const loadCollectionSearch = createLoader(collectionSearchParams);

export interface CollectionSearch {
  sort?: CollectionProductSortParam;
  page?: number;
}

/** 주소의 검색 파라미터를 읽는다. 잘못된 값(없는 정렬, 숫자가 아닌 페이지)은 기본값으로 읽는다 */
export function parseCollectionSearch(raw: Record<string, unknown>): CollectionSearch {
  const { sort, page } = loadCollectionSearch(raw as Record<string, string>);
  return { sort: sort ?? undefined, page: page > 1 ? page : undefined };
}

/**
 * 컬렉션 기본 정렬(응답 `productSort`) → 정렬 파라미터. 서버는 정렬 파라미터와 같은 값(`latest`·`priceAsc` 등)을 보낸다.
 * 값이 늘 수 있어 문자열이고, 모르는 값은 진열순(`manual`)으로 보인다
 */
export function defaultCollectionSort(productSort: string): CollectionProductSortParam {
  const known = collectionProductSortSchema.safeParse(productSort);
  return known.success ? known.data : "manual";
}

export const COLLECTION_SORT_LABELS: Readonly<Record<CollectionProductSortParam, string>> =
  lazyMessages<CollectionProductSortParam>({
    manual: () => m.collection_sort_manual(),
    recommend: () => m.products_search_sort_recommend(),
    latest: () => m.products_search_sort_latest(),
    priceAsc: () => m.products_search_sort_price_asc(),
    priceDesc: () => m.products_search_sort_price_desc(),
    reviewCount: () => m.products_search_sort_review_count(),
    ratingDesc: () => m.products_search_sort_rating_desc(),
  });
