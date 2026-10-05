import type { ProductCard as ProductCardData } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { ProductCard } from "../../components/product-card";
import { m } from "../../i18n";
import { useTrack } from "../../lib/analytics";
import { siteLayout } from "../layout";
import type { ProductListData } from "./data";

/** 열 수 → Tailwind 클래스. 클래스 이름을 문자열로 조합하면 Tailwind가 찾지 못해 정적 표로 둔다 */
const MOBILE_COLS = { 1: "grid-cols-1", 2: "grid-cols-2" } as const;
const DESKTOP_COLS = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" } as const;

export function gridClass(columns: { mobile: 1 | 2; desktop: 2 | 3 | 4 }): string {
  return `grid ${MOBILE_COLS[columns.mobile]} gap-x-2.5 gap-y-7 md:gap-x-5 md:gap-y-10 ${DESKTOP_COLS[columns.desktop]}`;
}

/** 섹션 제목 — 모바일 20 · 데스크톱 24 굵게, 오른쪽에 「더 보기」 */
export function SectionHeading({
  title,
  more,
}: {
  title?: string;
  more?: ProductListData["more"];
}) {
  if (!title && !more) return null;
  const moreClass = "flex shrink-0 items-center gap-0.5 text-meta text-sub hover:text-ink";
  const moreLabel = (
    <>
      {m.section_heading_more()}
      <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.6} />
    </>
  );
  return (
    <div className="flex min-w-0 items-end justify-between gap-4">
      {title ? (
        <h2 className="min-w-0 break-words font-bold font-display text-xl tracking-tight md:text-2xl">
          {title}
        </h2>
      ) : (
        <span />
      )}
      {more && "collection" in more ? (
        <Link to="/collections/$slug" params={{ slug: more.collection }} className={moreClass}>
          {moreLabel}
        </Link>
      ) : more ? (
        <Link
          to="/products"
          search={{ categoryId: more.categoryId, sort: more.sort }}
          className={moreClass}
        >
          {moreLabel}
        </Link>
      ) : null}
    </div>
  );
}

/** 섹션 껍데기 — 제목과 몸통 사이 간격을 섹션마다 같게 둔다 */
export function SectionShell({
  title,
  more,
  children,
  className = "",
}: {
  title?: string;
  more?: ProductListData["more"];
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex min-w-0 flex-col gap-4 md:gap-5 ${className}`}>
      <SectionHeading title={title} more={more} />
      {children}
    </section>
  );
}

/** 상품 목록 섹션의 노출 기록 — 목록 id는 `home:{섹션 id}`다 */
export function useListView(sectionId: string, products: readonly ProductCardData[]) {
  useTrack(
    products.length
      ? {
          name: "product_list_view",
          listId: `home:${sectionId}`,
          productIds: products.map((p) => p.productId),
        }
      : null,
  );
}

/** 섹션의 상품 카드 — 카드 모양은 목록 화면과 같다(`list.card`) */
export function SectionProductCard({ product }: { product: ProductCardData }) {
  return <ProductCard product={product} card={siteLayout.list.card} />;
}
