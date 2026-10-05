import type { SectionOf } from "../layout-schema";
import { gridClass, SectionProductCard, SectionShell, useListView } from "./common";
import type { SectionData } from "./data";

/** 상품 격자 — 열 수는 `columns`(모바일 1·2, 데스크톱 2·3·4) */
export function ProductGridSection({
  section,
  data,
}: {
  section: SectionOf<"productGrid">;
  data: SectionData<"productGrid">;
}) {
  useListView(section.id, data.products);
  return (
    <SectionShell title={section.title} more={section.moreLink ? data.more : null}>
      <div className={gridClass(section.columns)}>
        {data.products.map((product) => (
          <SectionProductCard key={product.productId} product={product} />
        ))}
      </div>
    </SectionShell>
  );
}
