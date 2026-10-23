import type {
  CategoryNode,
  CollectionProductPage,
  StorefrontCollectionDetail,
} from "@sayren/storefront-sdk";
import { useNavigate } from "@tanstack/react-router";
import { SORTS } from "../../lib/catalog";
import { Pagination } from "../molecules/pagination";
import { ListToolbar } from "../organisms/list-toolbar";
import { ProductGrid } from "../organisms/product-grid";
import { CollectionPeriod } from "./collection-list-template";

type CollectionSort = "manual" | (typeof SORTS)[number]["value"];
const OPTIONS: { value: CollectionSort; label: string }[] = [
  { value: "manual", label: "기획전 순서" },
  ...SORTS,
];

/** 기획전 하나 — 크림 면 머리(제목·설명·기간), 정렬 줄, 상품 격자 */
export function CollectionTemplate({
  collection,
  products,
  sort,
  tree,
}: {
  collection: StorefrontCollectionDetail;
  products: CollectionProductPage;
  sort: CollectionSort | null;
  tree: CategoryNode[];
}) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-8 pt-6 pb-8">
      <header className="relative flex min-h-[280px] flex-col justify-end gap-3 overflow-hidden bg-tone-cream p-6 md:min-h-[360px] md:p-14">
        {collection.imageUrl ? (
          <img
            src={collection.imageUrl}
            alt=""
            className="absolute inset-y-0 right-0 hidden h-full w-2/5 object-cover md:block"
          />
        ) : null}
        <span className="relative text-muted text-small">기획전</span>
        <h1 className="relative font-display text-hero leading-[1.2]">{collection.title}</h1>
        {collection.description ? (
          <p className="relative max-w-[520px] text-lead text-prose leading-[1.8]">
            {collection.description}
          </p>
        ) : null}
        <span className="relative">
          <CollectionPeriod startsAt={collection.startsAt} endsAt={collection.endsAt} />
        </span>
      </header>
      <ListToolbar
        total={products.totalElements}
        sort={{
          value: sort ?? (collection.productSort as CollectionSort),
          options: OPTIONS,
          onChange: (value) =>
            navigate({
              to: ".",
              search: (prev: Record<string, unknown>) => ({
                ...prev,
                sort: value,
                page: undefined,
              }),
            }),
        }}
      />
      <ProductGrid products={products.contents} tree={tree} emptyText="기획전 상품이 없습니다." />
      <Pagination page={products.page} totalPages={products.totalPages} />
    </div>
  );
}
