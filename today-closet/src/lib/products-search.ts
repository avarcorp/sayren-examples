import { type ProductSort, productSortSchema } from "@sayren/storefront-sdk";
import { createLoader, parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs";
import { lazyMessages, m } from "../i18n";

/**
 * 상품 목록의 URL 상태(검색어·카테고리·정렬·페이지) — nuqs 파서가 원천이다.
 *
 * 라우트의 `validateSearch`(서버·브라우저 공통, loader 입력)와 화면의 `useQueryStates`(검색·정렬 변경)가 같은
 * 파서를 쓴다. 조건이 URL에 있으니 공유·새로고침·뒤로가기가 그대로 동작한다. 기본값(1페이지·추천순)은 주소에서 뺀다.
 */
export const productsSearchParams = {
  keyword: parseAsString,
  categoryId: parseAsString,
  // 정렬 값은 SDK 스키마가 원천이다. 기본값은 서버 기본값과 같은 추천순이다
  sort: parseAsStringLiteral(productSortSchema.options).withDefault("recommend"),
  page: parseAsInteger.withDefault(1),
  minPrice: parseAsInteger,
  maxPrice: parseAsInteger,
};

/** 가격 필터 구간 — 목록 화면의 칩. 값은 원 단위이고 없는 끝은 열린 구간이다 */
export const PRICE_RANGES = [
  { key: "under30k", maxPrice: 30000 },
  { key: "30k50k", minPrice: 30000, maxPrice: 50000 },
  { key: "50k100k", minPrice: 50000, maxPrice: 100000 },
  { key: "over100k", minPrice: 100000 },
] as const satisfies ReadonlyArray<{ key: string; minPrice?: number; maxPrice?: number }>;

export const PRICE_LABELS = lazyMessages<(typeof PRICE_RANGES)[number]["key"]>({
  under30k: () => m.products_price_under_30k(),
  "30k50k": () => m.products_price_30k_50k(),
  "50k100k": () => m.products_price_50k_100k(),
  over100k: () => m.products_price_over_100k(),
});

const loadProductsSearch = createLoader(productsSearchParams);

/** 라우트가 쓰는 검색 조건. 기본값인 항목은 비워 두어 링크가 주소에 싣지 않는다 */
export interface ProductsSearch {
  keyword?: string;
  categoryId?: string;
  sort?: ProductSort;
  page?: number;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * 주소의 검색 파라미터를 읽는다. 잘못된 값(없는 정렬, 숫자가 아닌 페이지)은 오류 화면 대신 기본값으로 읽는다.
 * 라우터는 `?page=2`를 숫자로, `?keyword=%22a%22`를 문자열로 먼저 풀어 두므로 nuqs 로더가 다시 문자열로 읽는다.
 */
export function parseProductsSearch(raw: Record<string, unknown>): ProductsSearch {
  const { keyword, categoryId, sort, page, minPrice, maxPrice } = loadProductsSearch(
    raw as Record<string, string>,
  );
  return {
    keyword: keyword?.trim() || undefined,
    categoryId: categoryId || undefined,
    sort: sort === "recommend" ? undefined : sort,
    page: page > 1 ? page : undefined,
    minPrice: minPrice != null && minPrice > 0 ? minPrice : undefined,
    maxPrice: maxPrice != null && maxPrice > 0 ? maxPrice : undefined,
  };
}

export const SORT_LABELS: Readonly<Record<ProductSort, string>> = lazyMessages<ProductSort>({
  recommend: () => m.products_search_sort_recommend(),
  latest: () => m.products_search_sort_latest(),
  priceAsc: () => m.products_search_sort_price_asc(),
  priceDesc: () => m.products_search_sort_price_desc(),
  reviewCount: () => m.products_search_sort_review_count(),
  ratingDesc: () => m.products_search_sort_rating_desc(),
});

/**
 * 검색 화면(`/search`)의 URL 상태 — 검색어는 `q`이고 나머지(카테고리·정렬·가격·페이지)는 상품 목록과 같은 파서다.
 * 검색은 상품 목록과 같은 API(`GET /products?keyword=`)를 부른다(`toProductsSearch`).
 */
export const searchPageParams = {
  q: parseAsString,
  categoryId: productsSearchParams.categoryId,
  sort: productsSearchParams.sort,
  page: productsSearchParams.page,
  minPrice: productsSearchParams.minPrice,
  maxPrice: productsSearchParams.maxPrice,
};

export interface SearchPageSearch extends Omit<ProductsSearch, "keyword"> {
  q?: string;
}

/** 주소의 검색 파라미터를 읽는다 — 규칙은 `parseProductsSearch`와 같다(빈 검색어·기본값은 비운다) */
export function parseSearchPage(raw: Record<string, unknown>): SearchPageSearch {
  const { keyword, ...rest } = parseProductsSearch({ ...raw, keyword: raw.q });
  return { q: keyword, ...rest };
}

/** 검색 화면 조건 → 상품 검색 조건(쿼리 키도 상품 목록과 같아진다) */
export function toProductsSearch({ q, ...rest }: SearchPageSearch): ProductsSearch {
  return { keyword: q, ...rest };
}

/** 상품 목록의 옛 검색 주소(`/products?keyword=`) → 검색 화면 조건 */
export function toSearchPage({ keyword, ...rest }: ProductsSearch): SearchPageSearch {
  return { q: keyword, ...rest };
}
