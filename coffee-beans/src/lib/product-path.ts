/** 상품 주소 파라미터 — 상품 번호(`productNo`)를 쓰고, 번호가 없는 옛 응답만 상품 id를 쓴다. API 요청은 productId로 보낸다 */
export function productPathParam(product: { productNo: number | null; productId: string }): string {
  return product.productNo !== null ? String(product.productNo) : product.productId;
}
