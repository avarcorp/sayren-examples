import { Link } from "@tanstack/react-router";
import { ProductPurchase } from "../../components/product-purchase";
import { ProductThumb } from "../../components/product-thumb";
import { productPathParam } from "../../lib/product-path";
import { siteLayout } from "../layout";
import type { SectionOf } from "../layout-schema";
import { SectionShell, useListView } from "./common";
import type { SectionData } from "./data";

/** 상품 하나를 크게 — 원 프로덕트용. 구매 영역은 상세와 같은 컴포넌트다 */
export function ProductSpotlightSection({
  section,
  data,
}: {
  section: SectionOf<"productSpotlight">;
  data: SectionData<"productSpotlight">;
}) {
  const { product } = data;
  useListView(section.id, [product]);
  const stacked = section.variant === "stacked";
  const image = (
    <Link
      to="/products/$productId"
      params={{ productId: productPathParam(product) }}
      className="block"
    >
      <ProductThumb
        src={product.thumbnailUrl}
        alt={product.name}
        className="aspect-square w-full bg-chip object-cover"
      />
    </Link>
  );
  return (
    <SectionShell title={section.title}>
      <div
        className={
          stacked
            ? "mx-auto flex w-full max-w-xl flex-col gap-6"
            : "grid items-start gap-6 md:grid-cols-2 md:gap-12"
        }
      >
        {section.variant === "imageRight" ? null : image}
        <ProductPurchase
          product={product}
          heading="h2"
          optionStyle={siteLayout.detail.optionStyle}
        />
        {section.variant === "imageRight" ? (
          <div className="order-first md:order-none">{image}</div>
        ) : null}
      </div>
    </SectionShell>
  );
}
