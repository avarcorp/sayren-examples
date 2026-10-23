import type { CategoryNode, ProductPage } from "@sayren/storefront-sdk";
import type { ReactNode } from "react";
import { Pagination } from "../molecules/pagination";
import { SearchField } from "../molecules/search-field";
import { ProductGrid } from "../organisms/product-grid";

/** 검색 — 큰 검색칸, 결과 수, 격자. 결과 블록은 검색어가 있을 때만 그린다 */
export function SearchTemplate({
  keyword,
  onSearch,
  children,
}: {
  keyword?: string;
  onSearch: (keyword: string) => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-10 pt-12 pb-8">
      <h1 className="sr-only">상품 검색</h1>
      <SearchField defaultValue={keyword} onSubmit={onSearch} />
      {children}
    </div>
  );
}

export function SearchResults({
  keyword,
  page,
  tree,
}: {
  keyword: string;
  page: ProductPage;
  tree: CategoryNode[];
}) {
  return (
    <>
      <p className="text-body text-muted">
        「{keyword}」 검색 결과 <span className="font-medium text-ink">{page.totalElements}개</span>
      </p>
      <ProductGrid
        products={page.contents}
        tree={tree}
        emptyText="검색 결과가 없습니다. 다른 검색어를 입력합니다."
      />
      <Pagination page={page.page} totalPages={page.totalPages} />
    </>
  );
}
