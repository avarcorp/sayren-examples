import {
  ApiError,
  type CategoryNode,
  type ProductCard,
  type ProductDetail,
  type ProductSearchParams,
  type StorefrontClient,
} from "@sayren/storefront-sdk";
import type { ProductSource, Section, SectionOf, SectionType } from "../layout-schema";
import type { HomeSectionData, ProductListData, SectionData } from "./data";

/**
 * 섹션 데이터 로더 — `type` → 서버에서 데이터를 받는 함수. 데이터가 필요 없는 섹션은 null이다.
 * 홈 loader(`routes/index.tsx`)가 섹션마다 `Promise.all`로 부르고, 실패한 섹션은 null로 삼켜 그 섹션만 숨긴다.
 * 확장 지점: 새 섹션 타입을 더하면 여기와 `registry.tsx`에 같은 이름으로 넣는다(테스트가 둘의 대응을 본다).
 */
type CatalogApi = Pick<StorefrontClient, "catalog" | "store">;

/**
 * 홈 한 번 그리는 데 쓰는 스토어프론트 API 호출 예산. 섹션이 늘어도 SSR 한 번이 API를 몰아치지 않게 한다.
 * 예산을 넘긴 섹션은 실패로 보고 숨긴다(다른 섹션은 그대로 그린다).
 */
export const HOME_REQUEST_BUDGET = 40;
/** 섹션 하나가 쓸 수 있는 호출 수 — 상품 id로 고른 격자(최대 24개)가 들어가는 크기다 */
export const SECTION_REQUEST_BUDGET = 25;
/** 이미지를 받는 카테고리 변형(타일·원형)은 카테고리마다 대표 상품을 한 번 부르므로 이만큼만 보인다 */
export const CATEGORY_IMAGE_LIMIT = 8;

export class RequestBudgetExceeded extends Error {
  constructor(scope: string) {
    super(`스토어프론트 API 호출 예산을 넘었습니다(${scope})`);
  }
}

interface Budget {
  used: number;
  readonly limit: number;
  readonly scope: string;
}

function spend(...budgets: Budget[]) {
  for (const budget of budgets) {
    if (budget.used >= budget.limit) throw new RequestBudgetExceeded(budget.scope);
  }
  for (const budget of budgets) budget.used += 1;
}

/** 호출마다 예산을 쓰는 API — 섹션 예산과 홈 전체 예산을 함께 센다 */
function budgeted(api: CatalogApi, ...budgets: Budget[]): CatalogApi {
  const wrap =
    <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
    (...args: A): Promise<R> => {
      try {
        spend(...budgets);
      } catch (error) {
        return Promise.reject(error);
      }
      return fn(...args);
    };
  return {
    catalog: {
      ...api.catalog,
      listCategories: wrap(api.catalog.listCategories),
      searchProducts: wrap(api.catalog.searchProducts),
      getProduct: wrap(api.catalog.getProduct),
      listProductReviews: wrap(api.catalog.listProductReviews),
      listProductInquiries: wrap(api.catalog.listProductInquiries),
      listCollectionProducts: wrap(api.catalog.listCollectionProducts),
    },
    store: { ...api.store, get: wrap(api.store.get) },
  };
}

export interface LoaderContext {
  api: CatalogApi;
  /** 카테고리 트리 — 여러 섹션이 이름으로 찾아도 한 번만 받는다 */
  categories: () => Promise<CategoryNode[]>;
}

type SectionLoader<T extends SectionType> = (
  section: SectionOf<T>,
  ctx: LoaderContext,
) => Promise<SectionData<T> | null>;

function flatten(nodes: readonly CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

/**
 * 설정의 상품 조건 → 상품 목록. 이름으로 찾는 카테고리가 없거나 컬렉션이 없으면(숨김·기간 밖 포함) null(섹션을 숨긴다)
 */
export async function productsOf(
  source: ProductSource,
  limit: number,
  ctx: LoaderContext,
): Promise<ProductListData | null> {
  if ("collection" in source) {
    // 상품·순서·기본 정렬은 컬렉션 설정이다(`GET /collections/{slug}/products`, 호출 1회). 404 `COLLECTION_NOT_FOUND`는 숨김이다
    const page = await ctx.api.catalog
      .listCollectionProducts(source.collection, { size: limit })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      });
    if (!page) return null;
    return { products: page.contents, more: { collection: source.collection } };
  }
  if ("productIds" in source) {
    const found = await Promise.all(
      source.productIds
        .slice(0, limit)
        .map((id) => ctx.api.catalog.getProduct(id).catch(() => null)),
    );
    const products = found.filter((product): product is ProductDetail => product !== null);
    return { products, more: null };
  }
  const params: ProductSearchParams = { sort: source.sort, size: limit };
  if (source.category) {
    const category = flatten(await ctx.categories()).find((node) => node.name === source.category);
    if (!category) return null;
    params.categoryId = category.categoryId;
  }
  const page = await ctx.api.catalog.searchProducts(params);
  return {
    products: page.contents,
    more: { categoryId: params.categoryId, sort: source.sort },
  };
}

const productList = async (
  section: { source: ProductSource; limit: number },
  ctx: LoaderContext,
) => {
  const data = await productsOf(section.source, section.limit, ctx);
  return data && data.products.length > 0 ? data : null;
};

export const SECTION_LOADERS: { [K in SectionType]: SectionLoader<K> | null } = {
  hero: null,
  editorialBanner: null,
  brandStory: null,
  benefits: null,
  faq: null,
  notice: null,
  richText: null,
  categoryGrid: async (section, ctx) => {
    // 칩은 이름만 쓴다. 타일·원형은 설정 이미지가 먼저고, 없으면 카테고리의 첫 상품 이미지다 — 그래서 8개까지만
    const needsImage = section.variant !== "chips";
    const limit = Math.min(
      section.limit ?? Number.POSITIVE_INFINITY,
      needsImage ? CATEGORY_IMAGE_LIMIT : Number.POSITIVE_INFINITY,
    );
    const roots = (await ctx.categories()).slice(0, limit);
    if (roots.length === 0) return null;
    const categories = await Promise.all(
      roots.map(async (node) => {
        let image = section.images?.[node.name] ?? null;
        if (!image && needsImage) {
          const page = await ctx.api.catalog
            .searchProducts({ categoryId: node.categoryId, sort: "recommend", size: 1 })
            .catch(() => null);
          image = page?.contents[0]?.thumbnailUrl ?? null;
        }
        return { categoryId: node.categoryId, name: node.name, image };
      }),
    );
    return { categories };
  },
  productRail: productList,
  productGrid: productList,
  productSpotlight: async (section, ctx) => {
    const list = await productsOf(section.source, 1, ctx);
    const first = list?.products[0];
    if (!first) return null;
    // 구매 영역은 상세와 같은 컴포넌트다 — 옵션까지 있는 상세를 받는다
    const product = await ctx.api.catalog.getProduct(first.productId);
    return { product };
  },
  reviewHighlights: async (section, ctx) => {
    const list = await productsOf(section.source, 4, ctx);
    if (!list) return null;
    const pages = await Promise.all(
      list.products.map((product: ProductCard) =>
        ctx.api.catalog
          .listProductReviews(product.productId, { sort: "helpful", size: section.limit })
          .then((page) =>
            page.contents.map((review) => ({
              reviewId: review.reviewId,
              rating: review.rating,
              content: review.content,
              writerMaskedName: review.writerMaskedName,
              productId: product.productId,
              productNo: product.productNo,
              productName: product.name,
            })),
          )
          .catch(() => []),
      ),
    );
    const reviews = pages
      .flat()
      .filter((review) => review.content.trim().length > 0)
      .slice(0, section.limit);
    // 실제 후기가 3개 미만이면 숨긴다 — 빈 칸을 지어낸 문구로 채우지 않는다
    return reviews.length >= 3 ? { reviews } : null;
  },
  contactCta: async (_section, ctx) => {
    const store = await ctx.api.store.get();
    return { phone: store.customerCenterPhone, businessHours: store.businessHours };
  },
};

/** 홈 섹션 데이터를 한 번에 — 섹션 하나의 실패는 그 섹션만 숨긴다 */
export async function loadSectionData(
  api: CatalogApi,
  sections: readonly Section[],
): Promise<HomeSectionData> {
  const home: Budget = { used: 0, limit: HOME_REQUEST_BUDGET, scope: "홈" };
  let categories: Promise<CategoryNode[]> | null = null;
  // 카테고리 트리는 여러 섹션이 나눠 쓰므로 홈 예산에서만 한 번 센다
  const shared = budgeted(api, home);
  const listCategories = () => {
    categories ??= shared.catalog.listCategories();
    return categories;
  };
  const entries = await Promise.all(
    sections.map(async (section) => {
      const loader = SECTION_LOADERS[section.type] as SectionLoader<SectionType> | null;
      if (!loader) return [section.id, null] as const;
      const own: Budget = { used: 0, limit: SECTION_REQUEST_BUDGET, scope: `섹션 ${section.id}` };
      const ctx: LoaderContext = { api: budgeted(api, own, home), categories: listCategories };
      try {
        return [section.id, await loader(section as SectionOf<SectionType>, ctx)] as const;
      } catch (error) {
        console.warn(
          `[layout] 섹션 ${section.id}(${section.type}) 데이터를 받지 못했습니다`,
          error,
        );
        return [section.id, null] as const;
      }
    }),
  );
  return Object.fromEntries(entries) as HomeSectionData;
}
