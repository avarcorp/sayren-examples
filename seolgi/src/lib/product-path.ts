/**
 * 상품 주소의 경로 값 — 상품 주소는 `/products/{상품번호}`다. 번호가 없는 옛 응답만 상품 id를 쓴다.
 * 장바구니·주문서 같은 서버 요청에는 `productId`를 보낸다. 이 값은 링크에만 쓴다.
 */
export function productPathParam(product: {
  productId: string;
  productNo?: number | null;
}): string {
  return product.productNo != null ? String(product.productNo) : product.productId;
}

/** 경로 값이 상품번호인가 — 숫자만이면 번호다(상품 id는 접두사가 있다) */
export function isProductNoParam(value: string): boolean {
  return /^[1-9]\d{0,8}$/.test(value);
}
