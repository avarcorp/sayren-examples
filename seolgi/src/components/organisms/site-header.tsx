import type { CategoryNode } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, User } from "lucide-react";
import { BrandMark } from "../atoms/brand-mark";

interface Props {
  storeName: string;
  categories: CategoryNode[];
  /** 진행 중인 기획전이 있으면 메뉴 끝에 「기획전」 */
  showCollections: boolean;
  /** 장바구니 담은 줄 수. 주문을 받지 않으면 null(장바구니를 숨긴다) */
  cartCount: number | null;
}

/** 헤더 — 로고, 대분류 메뉴, 검색·계정·장바구니 */
export function SiteHeader({ storeName, categories, showCollections, cartCount }: Props) {
  const count = cartCount ?? 0;
  return (
    <header className="border-line border-b">
      {/* 모바일은 카테고리 메뉴가 둘째 줄로 내려가므로 높이를 고정하지 않는다 */}
      <div className="mx-auto flex min-h-16 max-w-page flex-wrap items-center gap-x-10 px-4 pt-2.5 md:h-[72px] md:pt-0 md:px-10">
        <Link to="/" aria-label={`${storeName} 홈`} className="flex shrink-0 items-center gap-2">
          <BrandMark className="h-7 w-auto text-brand md:h-[34px]" />
          <span className="font-display text-ink text-title md:text-h3">설기로운</span>
        </Link>
        <nav
          aria-label="카테고리"
          className="order-3 -mx-4 flex w-[calc(100%+2rem)] gap-7 overflow-x-auto px-4 pb-3 text-sm md:order-none md:mx-0 md:w-auto md:flex-1 md:overflow-visible md:p-0"
        >
          {categories.map((c) => (
            <Link
              key={c.categoryId}
              to="/products"
              search={{ categoryId: c.categoryId }}
              className="whitespace-nowrap py-1 hover:text-muted"
              activeProps={{ className: "font-bold" }}
            >
              {c.name}
            </Link>
          ))}
          {showCollections ? (
            <Link
              to="/collections"
              className="whitespace-nowrap py-1 hover:text-muted"
              activeProps={{ className: "font-bold" }}
            >
              기획전
            </Link>
          ) : null}
        </nav>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link to="/search" aria-label="검색" className="grid size-11 place-items-center">
            <Search className="size-5" strokeWidth={1.5} aria-hidden />
          </Link>
          <Link to="/account" aria-label="내 계정" className="grid size-11 place-items-center">
            <User className="size-5" strokeWidth={1.5} aria-hidden />
          </Link>
          {cartCount !== null ? (
            <Link
              to="/cart"
              aria-label={count ? `장바구니 ${count}개` : "장바구니"}
              className="flex h-11 items-center gap-1.5 px-2 text-body"
            >
              <ShoppingBag className="size-5" strokeWidth={1.5} aria-hidden />
              {count ? <span aria-hidden>{count}</span> : null}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
