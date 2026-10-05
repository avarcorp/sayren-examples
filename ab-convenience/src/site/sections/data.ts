import type { ProductCard, ProductDetail, ProductSort } from "@sayren/storefront-sdk";
import type { SectionType } from "../layout-schema";

/**
 * 섹션이 loader에서 받는 데이터 — 서버 로더(`loaders.server.ts`)가 만들고 섹션 컴포넌트가 그린다.
 * 데이터가 필요 없는 섹션은 `null`이다.
 */
export interface ProductListData {
  products: ProductCard[];
  /** 「더 보기」가 갈 곳 — 상품 목록 조건 또는 컬렉션 화면(`/collections/{주소}`). 상품 id로 고른 섹션은 null */
  more: { categoryId?: string; sort?: ProductSort } | { collection: string } | null;
}

export interface SectionDataMap {
  hero: null;
  categoryGrid: { categories: { categoryId: string; name: string; image: string | null }[] };
  productRail: ProductListData;
  productGrid: ProductListData;
  productSpotlight: { product: ProductDetail };
  editorialBanner: null;
  brandStory: null;
  reviewHighlights: {
    reviews: {
      reviewId: string;
      rating: number;
      content: string;
      writerMaskedName: string;
      productId: string;
      /** 상품 주소에 쓰는 상품번호(#107). 옛 응답은 null */
      productNo: number | null;
      productName: string;
    }[];
  };
  benefits: null;
  faq: null;
  notice: null;
  contactCta: { phone: string | null; businessHours: string | null };
  richText: null;
}

export type SectionData<T extends SectionType> = SectionDataMap[T];

/** 홈 loader가 내려주는 값 — 섹션 id → 데이터. 로더가 실패했거나 보일 것이 없으면 null(섹션을 숨긴다) */
export type HomeSectionData = Record<string, SectionDataMap[SectionType] | null>;
