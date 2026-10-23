import type { ProductSort } from "@sayren/storefront-sdk";
import { mockCategories, mockCollections, mockProducts, mockStore } from "./catalog";
import { fail, newId, now, pageOf, type Route } from "./http";
import { memberIdOf, state } from "./state";

const topOf = new Map<string, string>();
for (const top of mockCategories) {
  topOf.set(top.categoryId, top.categoryId);
  for (const child of top.children) topOf.set(child.categoryId, top.categoryId);
}

function inCategory(categoryId: string, target: string) {
  return categoryId === target || topOf.get(categoryId) === target;
}

export function findProduct(ref: string) {
  return mockProducts.find((p) => p.card.productId === ref || String(p.card.productNo) === ref);
}

function priceOf(p: (typeof mockProducts)[number]) {
  return p.card.discountedPrice ?? p.card.salePrice;
}

function sortProducts(list: typeof mockProducts, sort: ProductSort | string | null) {
  const sorted = [...list];
  switch (sort) {
    case "latest":
      return sorted.sort((a, b) => b.addedAt - a.addedAt);
    case "priceAsc":
      return sorted.sort((a, b) => priceOf(a) - priceOf(b));
    case "priceDesc":
      return sorted.sort((a, b) => priceOf(b) - priceOf(a));
    case "reviewCount":
      return sorted.sort((a, b) => b.card.reviewCount - a.card.reviewCount);
    case "ratingDesc":
      return sorted.sort((a, b) => b.card.averageRating - a.card.averageRating);
    default:
      return sorted.sort((a, b) => (a.card.productNo ?? 0) - (b.card.productNo ?? 0));
  }
}

export const catalogRoutes: Route[] = [
  ["GET", /^\/store$/, () => ({ data: mockStore })],
  ["GET", /^\/categories$/, () => ({ data: mockCategories })],
  [
    "GET",
    /^\/products$/,
    ({ query }) => {
      const keyword = query.get("keyword")?.trim();
      const categoryId = query.get("categoryId");
      const min = query.get("minPrice");
      const max = query.get("maxPrice");
      // 패싯은 카테고리 조건을 빼고 센다(칩마다 수를 보이려고)
      const base = mockProducts.filter(
        (p) =>
          (!keyword || p.card.name.includes(keyword)) &&
          (query.get("freeShipping") !== "true" || p.card.freeShipping),
      );
      const matched = base.filter(
        (p) =>
          (!categoryId || inCategory(p.categoryId, categoryId)) &&
          (!min || priceOf(p) >= Number(min)) &&
          (!max || priceOf(p) <= Number(max)),
      );
      const counts = new Map<string, number>();
      for (const p of base) {
        counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
        const top = topOf.get(p.categoryId);
        if (top && top !== p.categoryId) counts.set(top, (counts.get(top) ?? 0) + 1);
      }
      const names = new Map<string, string>();
      for (const top of mockCategories) {
        names.set(top.categoryId, top.name);
        for (const c of top.children) names.set(c.categoryId, c.name);
      }
      const prices = base.map(priceOf);
      return {
        data: {
          ...pageOf(
            sortProducts(matched, query.get("sort")).map((p) => p.card),
            query,
          ),
          facets: {
            categories: [...counts].map(([id, count]) => ({
              categoryId: id,
              name: names.get(id) ?? "",
              count,
            })),
            priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
          },
        },
      };
    },
  ],
  [
    "GET",
    /^\/products\/([^/]+)$/,
    ({ params }) => {
      const product = findProduct(params[0] as string);
      if (!product) fail(404, "PRODUCT_NOT_FOUND", "상품을 찾을 수 없습니다");
      return { data: product.detail };
    },
  ],
  [
    "GET",
    /^\/products\/([^/]+)\/reviews$/,
    ({ params, query }) => {
      const product = findProduct(params[0] as string);
      if (!product) fail(404, "PRODUCT_NOT_FOUND", "상품을 찾을 수 없습니다");
      let list = [...product.reviews];
      if (query.get("hasImage") === "true") list = list.filter((r) => r.images.length > 0);
      const rating = query.get("rating");
      if (rating) list = list.filter((r) => r.rating === Number(rating));
      const sort = query.get("sort");
      if (sort === "ratingDesc") list.sort((a, b) => b.rating - a.rating);
      else if (sort === "ratingAsc") list.sort((a, b) => a.rating - b.rating);
      else if (sort === "helpful") list.sort((a, b) => b.images.length - a.images.length);
      else list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
      for (const r of product.reviews)
        distribution[String(r.rating)] = (distribution[String(r.rating)] ?? 0) + 1;
      return {
        data: {
          ...pageOf(list, query),
          summary: {
            averageRating: product.card.averageRating,
            totalCount: product.reviews.length,
            distribution,
          },
        },
      };
    },
  ],
  [
    "GET",
    /^\/products\/([^/]+)\/inquiries$/,
    (req) => {
      const product = findProduct(req.params[0] as string);
      if (!product) fail(404, "PRODUCT_NOT_FOUND", "상품을 찾을 수 없습니다");
      const memberId = memberIdOf(req);
      const mine = state.inquiries.filter(
        (i) =>
          i.productId === product.card.productId &&
          memberId &&
          i.writerMaskedName === `mine:${memberId}`,
      );
      const list = [
        ...mine.map((i) => ({ ...i, mine: true, writerMaskedName: "나" })),
        ...product.inquiries,
      ];
      return { data: pageOf(list, req.query) };
    },
  ],
  [
    "POST",
    /^\/products\/([^/]+)\/inquiries$/,
    (req) => {
      const product = findProduct(req.params[0] as string);
      if (!product) fail(404, "PRODUCT_NOT_FOUND", "상품을 찾을 수 없습니다");
      const memberId = memberIdOf(req);
      if (!memberId) fail(401, "UNAUTHORIZED", "로그인이 필요합니다");
      const body = req.body as { content: string; secret?: boolean; category?: string };
      state.inquiries.unshift({
        inquiryId: newId("inq"),
        content: body.content,
        secret: Boolean(body.secret),
        mine: true,
        writerMaskedName: `mine:${memberId}`,
        answer: null,
        createdAt: now(),
        productId: product.card.productId,
        productName: product.card.name,
        thumbnailUrl: product.card.thumbnailUrl,
        category: (body.category as "PRODUCT") ?? "PRODUCT",
      });
      return {};
    },
  ],
  [
    "GET",
    /^\/collections$/,
    ({ query }) => ({
      data: pageOf(
        mockCollections.map(({ productIds: _ids, ...c }) => c),
        query,
      ),
    }),
  ],
  [
    "GET",
    /^\/collections\/([^/]+)$/,
    ({ params }) => {
      const c = mockCollections.find((x) => x.slug === params[0]);
      if (!c) fail(404, "COLLECTION_NOT_FOUND", "기획전을 찾을 수 없습니다");
      const { productIds: _ids, ...rest } = c;
      return {
        data: {
          ...rest,
          productSort: "manual",
          metaTitle: null,
          metaDescription: null,
          salesComputedAt: null,
        },
      };
    },
  ],
  [
    "GET",
    /^\/collections\/([^/]+)\/products$/,
    ({ params, query }) => {
      const c = mockCollections.find((x) => x.slug === params[0]);
      if (!c) fail(404, "COLLECTION_NOT_FOUND", "기획전을 찾을 수 없습니다");
      const list = c.productIds.map((id) => findProduct(id)).filter((p) => p !== undefined);
      const sort = query.get("sort");
      const sorted = sort && sort !== "manual" ? sortProducts(list, sort) : list;
      return {
        data: pageOf(
          sorted.map((p) => p.card),
          query,
        ),
      };
    },
  ],
];
