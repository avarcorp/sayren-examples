import type { CategoryNode, ProductPage, ProductSort } from "@sayren/storefront-sdk";
import { Pagination } from "../molecules/pagination";
import type { ListToolbarProps } from "../organisms/list-toolbar";
import { ListToolbar } from "../organisms/list-toolbar";
import { ProductGrid } from "../organisms/product-grid";
import { type ChipItem, SubcategoryChips } from "../organisms/subcategory-chips";

export interface ProductListTemplateProps {
  title: string;
  chips: ChipItem[];
  categoryId: string | undefined;
  page: ProductPage;
  toolbar: Omit<ListToolbarProps<ProductSort>, "total">;
  tree: CategoryNode[];
}

/** 상품 목록 (시안 DList) — 제목·하위 칩, 필터 줄, 격자, 쪽 번호 */
export function ProductListTemplate({
  title,
  chips,
  categoryId,
  page,
  toolbar,
  tree,
}: ProductListTemplateProps) {
  return (
    <div className="flex flex-col gap-8 pt-12 pb-8">
      <div className="flex flex-col gap-5">
        <h1 className="font-display text-h1">{title}</h1>
        <SubcategoryChips items={chips} current={categoryId} />
      </div>
      <ListToolbar total={page.totalElements} {...toolbar} />
      <ProductGrid products={page.contents} categoryId={categoryId} tree={tree} />
      <Pagination page={page.page} totalPages={page.totalPages} />
    </div>
  );
}
