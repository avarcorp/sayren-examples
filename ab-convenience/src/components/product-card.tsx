import type { ProductCard as ProductCardData } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { m } from "../i18n";
import { formatPrice } from "../lib/format";
import { priceView } from "../lib/price";
import { productPathParam } from "../lib/product-path";
import type { CardLayout } from "../site/layout-schema";
import { ProductThumb } from "./product-thumb";
import { Price } from "./ui/price";

const ASPECT: Record<CardLayout["aspect"], string> = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
};

/** 카드 모양의 기본값 — 레이아웃 설정(`list.card`)이 없을 때 지금 모양 그대로다 */
export const DEFAULT_CARD: CardLayout = {
  aspect: "square",
  style: "plain",
  showRating: true,
  showPrice: true,
};

/**
 * 상품 카드 — 확장 지점: 찜 버튼·리뷰 별점 같은 요소는 여기에 붙인다.
 * 비율·테두리·가격 표시는 `src/site/layout.json`의 `list.card`가 정한다.
 */
export function ProductCard({
  product,
  card = DEFAULT_CARD,
}: {
  product: ProductCardData;
  card?: CardLayout;
}) {
  // 정가(또는 즉시할인 전 판매가) 대비 할인율·취소선 — `lib/price.ts` 한 곳에서 계산한다
  const { price, compareAt, rate } = priceView(product);
  const overlay = card.style === "overlay";

  const info = (
    <div
      className={overlay ? "flex min-w-0 flex-col gap-1 text-white" : "flex min-w-0 flex-col gap-1"}
    >
      <span className="line-clamp-2 break-words text-meta leading-snug">{product.name}</span>
      {card.showPrice ? (
        overlay ? (
          <span className="flex items-baseline gap-1.5 text-body-lg">
            {rate ? <span className="font-bold">{rate}%</span> : null}
            <span className="tabular font-bold">{formatPrice(price)}</span>
          </span>
        ) : (
          <Price view={{ price, compareAt, rate }} size="md" />
        )
      ) : null}
      {card.showRating && product.reviewCount > 0 ? (
        <span className={overlay ? "text-white/80 text-xs" : "text-muted text-xs"}>
          {m.product_card_rating({
            count: product.reviewCount,
            rating: product.averageRating.toFixed(1),
          })}
        </span>
      ) : null}
    </div>
  );

  return (
    <Link
      to="/products/$productId"
      params={{ productId: productPathParam(product) }}
      // 자동 테스트가 상품 카드를 찾는 표식이다. 카드 모양을 바꿔도 남겨 둔다
      data-testid="product-card"
      className={
        card.style === "bordered"
          ? "group flex min-w-0 flex-col gap-2.5 border border-line p-2"
          : "group flex min-w-0 flex-col gap-2.5"
      }
    >
      <div className={`relative ${ASPECT[card.aspect]} overflow-hidden bg-chip`}>
        <ProductThumb
          src={product.thumbnailUrl}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        {product.soldOut ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 font-semibold text-sm">
            {m.product_card_sold_out()}
          </span>
        ) : null}
        {overlay ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            {info}
          </div>
        ) : null}
      </div>
      {overlay ? null : info}
    </Link>
  );
}
