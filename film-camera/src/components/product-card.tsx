import type { ProductCard as ProductCardData } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { m } from "../i18n";
import { parseCameraName } from "../lib/camera-name";
import { productPathParam } from "../lib/product-path";
import { GradeBadge } from "./marks";
import { Price } from "./price";

/**
 * 사진이 없는 카메라의 자리 — 얇은 테두리와 작은 카메라 기호만 둔다. 이름은 카드 아래·구매 상자가 보인다
 */
export function TypeCover({
  soldOut = false,
  size = "card",
}: {
  soldOut?: boolean;
  size?: "card" | "detail";
}) {
  // 상세에서 사진이 없으면 모바일은 낮은 띠로 둬 이름·가격·구매 버튼이 첫 화면 위쪽에 오게 한다
  const frame = size === "detail" ? "h-16 lg:h-auto lg:aspect-[4/3]" : "aspect-[4/5]";
  return (
    <div
      aria-hidden="true"
      className={`flex w-full items-center justify-center border border-line ${frame} ${soldOut ? "text-line-strong" : "text-muted"}`}
    >
      <Camera size={22} strokeWidth={1.5} />
    </div>
  );
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const { grade, base } = parseCameraName(product.name);
  return (
    <Link
      to="/products/$productId"
      params={{ productId: productPathParam(product) }}
      className="group flex min-w-0 flex-col gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-point"
    >
      {product.thumbnailUrl ? (
        <div className="aspect-[4/5] overflow-hidden border border-line">
          <img
            src={product.thumbnailUrl}
            alt={product.name}
            loading="lazy"
            className={`h-full w-full object-cover ${product.soldOut ? "opacity-50 grayscale" : ""}`}
          />
        </div>
      ) : (
        <TypeCover soldOut={product.soldOut} />
      )}
      <div className="flex min-w-0 flex-col gap-1.5">
        {grade ? <GradeBadge grade={grade} /> : null}
        <p className="line-clamp-2 break-words text-body group-hover:underline">
          {grade ? base : product.name}
        </p>
        {product.soldOut ? (
          <p className="font-semibold text-body-lg text-muted">{m.product_sold_out()}</p>
        ) : (
          <Price product={product} />
        )}
      </div>
    </Link>
  );
}

/** 카드 그리드 — 2열(모바일) · 3열(768) · 4열(1024+) */
export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <li key={product.productId} className="min-w-0">
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
