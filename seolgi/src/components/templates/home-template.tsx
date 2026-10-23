import type { CategoryNode, ProductCard, ProductSort } from "@sayren/storefront-sdk";
import { CategoryShortcuts } from "../organisms/category-shortcuts";
import { Hero, type HeroContent } from "../organisms/hero";
import { NameTagPromo, type NameTagPromoContent } from "../organisms/name-tag-promo";
import { ProductRail } from "../organisms/product-rail";

export interface HomeTemplateProps {
  hero: HeroContent;
  tree: CategoryNode[];
  showCollections: boolean;
  rails: { title: string; sort: ProductSort; products: ProductCard[] }[];
  topCategoryOf: Record<string, string>;
  nameTag: {
    content: NameTagPromoContent;
    target: { categoryId: string; productPath: string | null };
  } | null;
}

/** 홈 (시안 DHome) — 히어로, 카테고리 원, 진열 두 줄, 이름표 소개. 데이터는 모두 props로 받는다 */
export function HomeTemplate({
  hero,
  tree,
  showCollections,
  rails,
  topCategoryOf,
  nameTag,
}: HomeTemplateProps) {
  return (
    <div className="flex flex-col gap-24 pt-6 pb-8 md:gap-[120px]">
      <Hero content={hero} />
      <CategoryShortcuts tree={tree} showCollections={showCollections} />
      {rails.map((rail, i) => (
        <ProductRail
          key={rail.title}
          id={`rail-${i}`}
          title={rail.title}
          sort={rail.sort}
          products={rail.products}
          topCategoryOf={topCategoryOf}
          tree={tree}
        />
      ))}
      {nameTag ? <NameTagPromo content={nameTag.content} target={nameTag.target} /> : null}
    </div>
  );
}
