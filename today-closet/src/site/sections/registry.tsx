import type { ReactNode } from "react";
import type { Section, SectionOf, SectionType } from "../layout-schema";
import { BenefitsSection } from "./benefits";
import { BrandStorySection } from "./brand-story";
import { CategoryGridSection } from "./category-grid";
import { ContactCtaSection } from "./contact-cta";
import type { SectionData } from "./data";
import { EditorialBannerSection } from "./editorial-banner";
import { FaqSection } from "./faq";
import { HeroSection } from "./hero";
import { NoticeSection } from "./notice";
import { ProductGridSection } from "./product-grid";
import { ProductRailSection } from "./product-rail";
import { ProductSpotlightSection } from "./product-spotlight";
import { ReviewHighlightsSection } from "./review-highlights";
import { RichTextSection } from "./rich-text";

/**
 * 섹션 레지스트리 — `type` → 컴포넌트. 데이터가 필요한 섹션은 로더(`loaders.server.ts`)가 같은 이름으로 있다.
 * 확장 지점: 레지스트리에 없는 모양이 필요할 때만 변형(props)을 더하거나 새 타입을 만든다. 먼저 `layout.json`으로 되는지 본다.
 */
interface RenderProps<T extends SectionType> {
  section: SectionOf<T>;
  data: SectionData<T>;
  storeName: string;
}

export const SECTION_COMPONENTS: {
  [K in SectionType]: (props: RenderProps<K>) => ReactNode;
} = {
  hero: ({ section, storeName }) => <HeroSection section={section} storeName={storeName} />,
  categoryGrid: ({ section, data }) => <CategoryGridSection section={section} data={data} />,
  productRail: ({ section, data }) => <ProductRailSection section={section} data={data} />,
  productGrid: ({ section, data }) => <ProductGridSection section={section} data={data} />,
  productSpotlight: ({ section, data }) => (
    <ProductSpotlightSection section={section} data={data} />
  ),
  editorialBanner: ({ section, storeName }) => (
    <EditorialBannerSection section={section} storeName={storeName} />
  ),
  brandStory: ({ section, storeName }) => (
    <BrandStorySection section={section} storeName={storeName} />
  ),
  reviewHighlights: ({ section, data }) => (
    <ReviewHighlightsSection section={section} data={data} />
  ),
  benefits: ({ section, storeName }) => <BenefitsSection section={section} storeName={storeName} />,
  faq: ({ section, storeName }) => <FaqSection section={section} storeName={storeName} />,
  notice: ({ section, storeName }) => <NoticeSection section={section} storeName={storeName} />,
  contactCta: ({ section, data, storeName }) => (
    <ContactCtaSection section={section} data={data} storeName={storeName} />
  ),
  richText: ({ section, storeName }) => <RichTextSection section={section} storeName={storeName} />,
};

/** 데이터가 필요한 섹션인가 — 로더가 null을 돌려주면(실패·보일 것 없음) 섹션을 그리지 않는다 */
export const SECTIONS_WITH_DATA: ReadonlySet<SectionType> = new Set<SectionType>([
  "categoryGrid",
  "productRail",
  "productGrid",
  "productSpotlight",
  "reviewHighlights",
  "contactCta",
]);

/** 섹션 하나를 그린다 — 데이터가 필요한 섹션인데 데이터가 없으면 숨긴다 */
export function SiteSection({
  section,
  data,
  storeName,
}: {
  section: Section;
  data: unknown;
  storeName: string;
}) {
  if (SECTIONS_WITH_DATA.has(section.type) && (data === null || data === undefined)) return null;
  const Component = SECTION_COMPONENTS[section.type] as (
    props: RenderProps<SectionType>,
  ) => ReactNode;
  // 표식은 스냅샷·e2e가 섹션을 찾는 데 쓴다
  return (
    <div data-section={section.type} data-section-id={section.id}>
      <Component
        section={section as SectionOf<SectionType>}
        data={data as SectionData<SectionType>}
        storeName={storeName}
      />
    </div>
  );
}
