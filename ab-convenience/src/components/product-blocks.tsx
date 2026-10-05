import type { ProductDetail, PublicInquiry, PublicReview } from "@sayren/storefront-sdk";
import { m } from "../i18n";
import type { DetailBlock } from "../site/layout-schema";
import { deliverySummaryOf } from "./product-buy-box";
import { ProductDescription } from "./product-description";
import { ProductQna } from "./product-inquiries";
import { deliveryNoteOf, localMethodsOf } from "./product-purchase";

/** 상세 아래 블록이 쓰는 데이터 — 설정에 있는 블록만 loader가 받는다. 받지 못했으면 null(블록을 숨긴다) */
export interface ProductBlockData {
  reviews: { contents: PublicReview[]; totalElements: number } | null;
  inquiries: { contents: PublicInquiry[]; totalElements: number } | null;
  /** 구매자가 로그인했는가 — 문의 작성 폼과 로그인 안내를 가른다 */
  loggedIn: boolean;
  /** 로그인한 구매자가 이 상품을 찜했는가 */
  wished: boolean;
}

const heading = "font-display font-semibold";

export function Reviews({ data }: { data: ProductBlockData["reviews"] }) {
  if (!data) return null;
  return (
    <section className="space-y-3 border-line border-t pt-5">
      <h2 className={heading}>{m.product_blocks_reviews_title({ count: data.totalElements })}</h2>
      {data.contents.length === 0 ? (
        <p className="text-muted text-sm">{m.product_blocks_reviews_empty()}</p>
      ) : (
        <ul className="space-y-3">
          {data.contents.map((review) => (
            <li key={review.reviewId} className="space-y-1 text-sm">
              <p className="text-muted text-xs">
                {m.product_blocks_review_meta({
                  rating: review.rating,
                  writer: review.writerMaskedName,
                })}
                {review.optionName ? ` · ${review.optionName}` : ""}
              </p>
              <p className="whitespace-pre-line">{review.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Fulfillment({ product }: { product: ProductDetail }) {
  return (
    <section className="space-y-2 border-line border-t pt-5">
      <h2 className={heading}>{m.product_blocks_fulfillment_title()}</h2>
      <dl className="grid grid-cols-[7.5rem_1fr] gap-y-2 text-sm">
        <dt className="text-muted">{m.product_blocks_delivery_method()}</dt>
        <dd>{deliveryNoteOf(product.fulfillment)}</dd>
        <dt className="text-muted">{m.product_blocks_shipping_fee()}</dt>
        <dd>{deliverySummaryOf(product.fulfillment)}</dd>
        {localMethodsOf(product.fulfillment) ? (
          <>
            <dt className="text-muted">{m.product_blocks_prepare()}</dt>
            <dd>{m.pd_info_local_prepare()}</dd>
          </>
        ) : (
          <>
            <dt className="text-muted">{m.product_blocks_dispatch()}</dt>
            <dd>{m.product_blocks_dispatch_value()}</dd>
            <dt className="text-muted">{m.product_blocks_remote()}</dt>
            <dd>{m.product_blocks_remote_value()}</dd>
          </>
        )}
      </dl>
    </section>
  );
}

/** 상세 아래 블록 — 순서는 `src/site/layout.json`의 `detail.blocks`다 */
export function ProductBlocks({
  product,
  blocks,
  data,
}: {
  product: ProductDetail;
  blocks: readonly DetailBlock[];
  data: ProductBlockData;
}) {
  return (
    <>
      {blocks.map((block) => {
        switch (block) {
          case "description":
            return (
              <section key={block} className="space-y-2 border-line border-t pt-5">
                <h2 className="font-semibold">{m.product_blocks_description_title()}</h2>
                <ProductDescription description={product.description ?? ""} />
              </section>
            );
          case "reviews":
            return <Reviews key={block} data={data.reviews} />;
          case "fulfillment":
            return <Fulfillment key={block} product={product} />;
          case "inquiry":
            return (
              <ProductQna
                key={block}
                productId={product.productId}
                data={data.inquiries}
                loggedIn={data.loggedIn}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
