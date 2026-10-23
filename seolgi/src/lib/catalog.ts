import type { ProductPage, ProductSort } from "@sayren/storefront-sdk";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFor } from "./api.server";

export const SORTS: { value: ProductSort; label: string }[] = [
  { value: "recommend", label: "추천순" },
  { value: "latest", label: "최신순" },
  { value: "priceAsc", label: "낮은 가격순" },
  { value: "priceDesc", label: "높은 가격순" },
  { value: "reviewCount", label: "리뷰 많은순" },
  { value: "ratingDesc", label: "평점 높은순" },
];

export const productSearchSchema = z.object({
  keyword: z.string().trim().min(1).max(100).optional(),
  categoryId: z.string().optional(),
  sort: z
    .enum(["recommend", "latest", "priceAsc", "priceDesc", "reviewCount", "ratingDesc"])
    .optional(),
  freeShipping: z.boolean().optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).optional(),
  page: z.number().int().min(1).optional(),
  size: z.number().int().min(1).max(60).optional(),
});
export type ProductSearch = z.infer<typeof productSearchSchema>;

/**
 * 주소(검색 파라미터) 검증 — 오래된 링크나 손으로 고친 주소의 틀린 값은 버리고 화면은 그린다.
 * 서버 함수 입력은 위의 엄격한 스키마로 검사한다.
 */
export const productListSearchSchema = z.object({
  categoryId: z.coerce.string().optional().catch(undefined),
  sort: productSearchSchema.shape.sort.catch(undefined),
  freeShipping: z.boolean().optional().catch(undefined),
  minPrice: productSearchSchema.shape.minPrice.catch(undefined),
  maxPrice: productSearchSchema.shape.maxPrice.catch(undefined),
  page: productSearchSchema.shape.page.catch(undefined),
});
export const keywordSearchSchema = z.object({
  keyword: productSearchSchema.shape.keyword.catch(undefined),
  page: productSearchSchema.shape.page.catch(undefined),
});

const searchProductsFn = createServerFn({ method: "GET" })
  .validator(productSearchSchema)
  .handler(({ data }): Promise<ProductPage> => apiFor().catalog.searchProducts(data));

export const productsQuery = (search: ProductSearch) =>
  queryOptions({
    queryKey: ["products", search],
    queryFn: () => searchProductsFn({ data: search }),
  });

export interface HomeData {
  rails: { title: string; sort: ProductSort; products: ProductPage["contents"] }[];
  /** 상품 id → 대분류 id — 사진 없는 카드의 면 색을 대분류로 고른다 */
  topCategoryOf: Record<string, string>;
  /** 이름표 소개 버튼이 갈 곳 — 그 카테고리 상품이 하나면 상품, 아니면 목록 */
  nameTag: { categoryId: string; productPath: string | null } | null;
}

/** 홈 — 진열 두 줄(최신·리뷰 많은), 상품→대분류 표, 이름표 소개 대상. 하나가 실패하면 그 부분만 비운다 */
export const getHomeFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      rails: z
        .array(z.object({ title: z.string(), sort: productSearchSchema.shape.sort.unwrap() }))
        .max(4),
      nameTagCategory: z.string(),
    }),
  )
  .handler(async ({ data }): Promise<HomeData> => {
    const api = apiFor();
    const tree = await api.catalog.listCategories().catch(() => []);
    const [rails, perTop] = await Promise.all([
      Promise.all(
        data.rails.map((r) =>
          api.catalog
            .searchProducts({ sort: r.sort, size: 4 })
            .then((page) => ({ title: r.title, sort: r.sort, products: page.contents }))
            .catch(() => ({ title: r.title, sort: r.sort, products: [] })),
        ),
      ),
      Promise.all(
        tree.map((top) =>
          api.catalog
            .searchProducts({ categoryId: top.categoryId, size: 60 })
            .then((page) => ({ top, products: page.contents }))
            .catch(() => ({ top, products: [] })),
        ),
      ),
    ]);
    const topCategoryOf: Record<string, string> = {};
    for (const { top, products } of perTop)
      for (const p of products) topCategoryOf[p.productId] ??= top.categoryId;
    const tagTop = perTop.find(({ top }) => top.name === data.nameTagCategory);
    const only = tagTop?.products.length === 1 ? tagTop.products[0] : null;
    return {
      rails: rails.filter((r) => r.products.length > 0),
      topCategoryOf,
      nameTag: tagTop
        ? {
            categoryId: tagTop.top.categoryId,
            productPath: only ? String(only.productNo ?? only.productId) : null,
          }
        : null,
    };
  });
