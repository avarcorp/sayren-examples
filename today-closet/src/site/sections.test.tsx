import {
  ApiError,
  type ProductCard,
  type ProductDetail,
  type StorefrontClient,
} from "@sayren/storefront-sdk";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SECTION_TYPES, type Section, type SectionType, sectionSchema } from "./layout-schema";
import type { SectionDataMap } from "./sections/data";
import {
  CATEGORY_IMAGE_LIMIT,
  HOME_REQUEST_BUDGET,
  loadSectionData,
  SECTION_LOADERS,
  SECTION_REQUEST_BUDGET,
} from "./sections/loaders.server";
import { SECTION_COMPONENTS, SECTIONS_WITH_DATA, SiteSection } from "./sections/registry";

/**
 * 섹션 레지스트리 — 모든 타입 × 변형을 고정 데이터로 서버 렌더한다. 조합을 다 돌지 않고 변형 하나하나가 그려지는지 본다.
 */

const card: ProductCard = {
  productId: "p1",
  productNo: 10001,
  name: "테스트 상품",
  thumbnailUrl: "https://cdn.example.com/p1.webp",
  salePrice: 10000,
  discountedPrice: 9000,
  discountRate: 10,
  originalPrice: 12000,
  freeShipping: false,
  fulfillment: { type: "SHIPPING", requiresShipping: true } as ProductCard["fulfillment"],
  averageRating: 4.5,
  reviewCount: 3,
  soldOut: false,
};

const detail = {
  ...card,
  description: "<p>설명</p>",
  images: [],
  optionGroups: [],
  variants: [],
  addonGroups: [],
  customInputs: [],
  fulfillment: {
    type: "SHIPPING",
    requiresShipping: true,
    shipping: { deliveryType: "PAID", deliveryFee: 3000, estimatedDays: null },
  },
  returnPeriodDays: 7,
  categoryPath: [],
} as unknown as ProductDetail;

const DATA: SectionDataMap = {
  hero: null,
  categoryGrid: {
    categories: [
      { categoryId: "c1", name: "상의", image: "https://cdn.example.com/c1.webp" },
      { categoryId: "c2", name: "하의", image: null },
    ],
  },
  productRail: { products: [card], more: { sort: "latest" } },
  productGrid: { products: [card], more: { categoryId: "c1", sort: "recommend" } },
  productSpotlight: { product: detail },
  editorialBanner: null,
  brandStory: null,
  reviewHighlights: {
    reviews: [1, 2, 3].map((n) => ({
      reviewId: `r${n}`,
      rating: 5,
      content: `후기 ${n}`,
      writerMaskedName: "김**",
      productNo: 1,
      productId: "p1",
      productName: "테스트 상품",
    })),
  },
  benefits: null,
  faq: null,
  notice: null,
  contactCta: { phone: "02-000-0000", businessHours: "평일 10:00~17:00" },
  richText: null,
};

const IMG = "https://cdn.example.com/a.webp";

/** 타입마다 최소 설정 — 변형은 테스트가 바꿔 넣는다 */
const BASE: Record<SectionType, Record<string, unknown>> = {
  hero: {
    slides: [
      {
        title: "{storeName} 봄",
        subtitle: "부제",
        image: IMG,
        cta: { label: "보기", to: "/products" },
      },
      { title: "둘째", image: IMG },
    ],
  },
  categoryGrid: { title: "카테고리" },
  productRail: { title: "베스트", source: { sort: "reviewCount" }, moreLink: true },
  productGrid: { title: "새 상품", source: { sort: "latest" } },
  productSpotlight: { source: { productIds: ["p1"] } },
  editorialBanner: {
    items: [
      { image: IMG, title: "룩북", to: "/products" },
      { image: IMG, title: "기획전" },
    ],
  },
  brandStory: { title: "{storeName} 이야기", image: IMG, paragraphs: ["첫 문단", "둘째 문단"] },
  reviewHighlights: {},
  benefits: { items: [{ title: "무료배송", description: "5만 원 이상" }, { title: "7일 교환" }] },
  faq: { items: [{ question: "배송은 언제 합니까", answer: "평일 출고합니다" }] },
  notice: { text: "이번 주 금요일은 쉽니다", to: "/products" },
  contactCta: { description: "문의를 남겨 주십시오" },
  richText: { title: "안내", paragraphs: ["본문"] },
};

function variantsOf(type: SectionType): (string | undefined)[] {
  const option = sectionSchema.options.find((o) => o.shape.type.value === type);
  const variant = option && "variant" in option.shape ? option.shape.variant : undefined;
  // ZodDefault<ZodEnum> → 값 목록
  const inner = (variant as { def?: { innerType?: { options?: string[] } } } | undefined)?.def
    ?.innerType;
  return inner?.options ?? [undefined];
}

async function render(node: ReactNode): Promise<string> {
  const rootRoute = createRootRoute({ component: () => <>{node}</> });
  const products = createRoute({ getParentRoute: () => rootRoute, path: "/products" });
  const product = createRoute({ getParentRoute: () => rootRoute, path: "/products/$productId" });
  const collection = createRoute({
    getParentRoute: () => rootRoute,
    path: "/collections/$slug",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([products, product, collection]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
    isServer: true,
  });
  await router.load();
  return renderToString(<RouterProvider router={router} />);
}

describe("섹션 레지스트리", () => {
  it("타입마다 컴포넌트와 로더 항목이 있고, 데이터가 필요한 섹션만 로더가 있다", () => {
    expect(Object.keys(SECTION_COMPONENTS).sort()).toEqual([...SECTION_TYPES].sort());
    expect(Object.keys(SECTION_LOADERS).sort()).toEqual([...SECTION_TYPES].sort());
    for (const type of SECTION_TYPES) {
      expect(SECTION_LOADERS[type] !== null, type).toBe(SECTIONS_WITH_DATA.has(type));
    }
  });

  for (const type of SECTION_TYPES) {
    for (const variant of variantsOf(type)) {
      it(`${type}${variant ? ` · ${variant}` : ""}을 그린다`, async () => {
        const section = sectionSchema.parse({
          id: "s1",
          type,
          ...BASE[type],
          ...(variant ? { variant } : {}),
        }) as Section;
        const html = await render(
          <SiteSection section={section} data={DATA[type]} storeName="데모 상점" />,
        );
        expect(html.length, `${type} ${variant}`).toBeGreaterThan(20);
        expect(html).not.toContain("{storeName}");
        expect(html).toContain(`data-section="${type}"`);
      });
    }
  }

  it("컬렉션 섹션의 「더 보기」는 컬렉션 화면으로 간다", async () => {
    const section = sectionSchema.parse({
      id: "c",
      type: "productRail",
      title: "가을 신상",
      source: { collection: "fall-new" },
      moreLink: true,
    }) as Section;
    const html = await render(
      <SiteSection
        section={section}
        data={{ products: [card], more: { collection: "fall-new" } }}
        storeName="상점"
      />,
    );
    expect(html).toContain('href="/collections/fall-new"');
  });

  it("데이터가 필요한 섹션은 데이터가 없으면 그리지 않는다", async () => {
    const section = sectionSchema.parse({ id: "g", type: "productGrid" }) as Section;
    const html = await render(<SiteSection section={section} data={null} storeName="상점" />);
    expect(html).not.toContain("product-card");
  });
});

describe("섹션 데이터 로더", () => {
  const fakeApi = (overrides: Partial<StorefrontClient["catalog"]> = {}) =>
    ({
      catalog: {
        listCategories: async () => [
          { categoryId: "c1", name: "스킨케어", depth: 1, children: [] },
        ],
        searchProducts: async (params: { categoryId?: string }) => ({
          contents: params.categoryId === "c1" ? [card] : [card, { ...card, productId: "p2" }],
          page: 1,
          size: 8,
          totalElements: 2,
          totalPages: 1,
        }),
        getProduct: async (id: string) => {
          if (id === "missing") throw new Error("404");
          return { ...detail, productId: id };
        },
        listProductReviews: async () => ({
          contents: [],
          page: 1,
          size: 6,
          totalElements: 0,
          totalPages: 0,
        }),
        ...overrides,
      },
      store: { get: async () => ({ customerCenterPhone: "02-1", businessHours: null }) },
    }) as unknown as Pick<StorefrontClient, "catalog" | "store">;

  it("카테고리 이름으로 찾고, 없는 이름이면 섹션을 숨긴다", async () => {
    const sections = [
      sectionSchema.parse({ id: "a", type: "productGrid", source: { category: "스킨케어" } }),
      sectionSchema.parse({ id: "b", type: "productGrid", source: { category: "없는 카테고리" } }),
      sectionSchema.parse({ id: "c", type: "hero", slides: [{ title: "x" }] }),
    ];
    const data = await loadSectionData(fakeApi(), sections);
    expect((data.a as SectionDataMap["productGrid"]).more).toEqual({
      categoryId: "c1",
      sort: "recommend",
    });
    expect(data.b).toBeNull();
    expect(data.c).toBeNull();
  });

  it("컬렉션 주소로 컬렉션 상품을 받고, 없거나 숨긴 컬렉션·빈 컬렉션이면 섹션을 숨긴다", async () => {
    const calls: Array<{ slug: string; size?: number }> = [];
    const api = fakeApi({
      listCollectionProducts: async (slug: string, params?: { size?: number }) => {
        calls.push({ slug, size: params?.size });
        if (slug === "hidden") {
          throw new ApiError(404, "COLLECTION_NOT_FOUND", "컬렉션을 찾을 수 없습니다");
        }
        return {
          contents: slug === "empty" ? [] : [card],
          page: 1,
          size: params?.size ?? 20,
          totalElements: slug === "empty" ? 0 : 1,
          totalPages: 1,
        };
      },
    } as Partial<StorefrontClient["catalog"]>);
    const data = await loadSectionData(api, [
      sectionSchema.parse({
        id: "a",
        type: "productRail",
        source: { collection: "fall-new" },
        limit: 6,
      }),
      sectionSchema.parse({ id: "b", type: "productGrid", source: { collection: "hidden" } }),
      sectionSchema.parse({ id: "c", type: "productGrid", source: { collection: "empty" } }),
    ]);
    expect(data.a).toEqual({ products: [card], more: { collection: "fall-new" } });
    expect(data.b).toBeNull();
    expect(data.c).toBeNull();
    expect(calls).toContainEqual({ slug: "fall-new", size: 6 });
  });

  it("컬렉션 주소 형식이 틀리면 설정 검사에서 거른다", () => {
    expect(
      sectionSchema.safeParse({ id: "x", type: "productGrid", source: { collection: "Fall New" } })
        .success,
    ).toBe(false);
    expect(
      sectionSchema.safeParse({
        id: "x",
        type: "productGrid",
        source: { collection: "fall-new", sort: "latest" },
      }).success,
    ).toBe(false);
  });

  it("섹션 하나가 실패해도 나머지는 받는다", async () => {
    const sections = [
      sectionSchema.parse({ id: "ok", type: "productGrid" }),
      sectionSchema.parse({ id: "broken", type: "categoryGrid" }),
    ];
    const data = await loadSectionData(
      fakeApi({
        listCategories: async () => {
          throw new Error("down");
        },
      }),
      sections,
    );
    expect(data.broken).toBeNull();
    expect((data.ok as SectionDataMap["productGrid"]).products).toHaveLength(2);
  });

  it("이미지를 받는 카테고리 변형은 8개까지만 부르고, 홈 전체 호출 예산을 넘긴 섹션은 숨긴다", async () => {
    let searches = 0;
    const many = Array.from({ length: 20 }, (_, i) => ({
      categoryId: `c${i}`,
      name: `분류${i}`,
      depth: 1,
      children: [],
    }));
    const api = fakeApi({
      listCategories: async () => many,
      searchProducts: async () => {
        searches += 1;
        return { contents: [card], page: 1, size: 1, totalElements: 1, totalPages: 1 };
      },
    });
    const tiles = await loadSectionData(api, [
      sectionSchema.parse({ id: "t", type: "categoryGrid", variant: "tiles", limit: 20 }),
    ]);
    expect((tiles.t as SectionDataMap["categoryGrid"]).categories).toHaveLength(
      CATEGORY_IMAGE_LIMIT,
    );
    expect(searches).toBe(CATEGORY_IMAGE_LIMIT);

    // 격자 섹션 하나는 검색 1번 — 예산보다 많이 두면 넘친 섹션만 빈다
    const grids = Array.from({ length: HOME_REQUEST_BUDGET + 5 }, (_, i) =>
      sectionSchema.parse({ id: `g${i}`, type: "productGrid" }),
    );
    const data = await loadSectionData(api, grids);
    const filled = Object.values(data).filter((value) => value !== null).length;
    expect(filled).toBe(HOME_REQUEST_BUDGET);
  });

  it("섹션 하나의 호출 예산을 넘기면 그 섹션만 숨긴다", async () => {
    const ids = Array.from({ length: 24 }, (_, i) => `p${i}`);
    const data = await loadSectionData(fakeApi(), [
      sectionSchema.parse({
        id: "ok",
        type: "productGrid",
        source: { productIds: ids },
        limit: 24,
      }),
    ]);
    expect((data.ok as SectionDataMap["productGrid"]).products).toHaveLength(24);
    expect(SECTION_REQUEST_BUDGET).toBeGreaterThanOrEqual(24);
  });

  it("상품 id로 고르면 없는 상품은 빼고, 후기가 3개 미만이면 후기 섹션을 숨긴다", async () => {
    const sections = [
      sectionSchema.parse({
        id: "ids",
        type: "productGrid",
        source: { productIds: ["p9", "missing"] },
      }),
      sectionSchema.parse({ id: "reviews", type: "reviewHighlights" }),
    ];
    const data = await loadSectionData(fakeApi(), sections);
    expect((data.ids as SectionDataMap["productGrid"]).products.map((p) => p.productId)).toEqual([
      "p9",
    ]);
    expect(data.reviews).toBeNull();
  });
});
