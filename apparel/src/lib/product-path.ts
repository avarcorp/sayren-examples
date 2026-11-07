/** 상품 주소 값 — 상품번호가 있으면 번호, 없는 옛 응답이면 상품 id다. 서버 요청에는 계속 productId를 보낸다 */
export function productPathParam(product: {
  productNo?: number | null;
  productId: string;
}): string {
  return String(product.productNo ?? product.productId);
}
