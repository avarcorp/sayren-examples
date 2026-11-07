import type { ProductCard } from "@sayren/storefront-sdk";

/** 상품 링크의 경로 값 — 상품번호가 있으면 번호, 없는 옛 응답이면 상품 id. 서버 요청에는 계속 productId를 보낸다 */
export function productPathParam(product: Pick<ProductCard, "productId" | "productNo">): string {
  return product.productNo === null ? product.productId : String(product.productNo);
}
