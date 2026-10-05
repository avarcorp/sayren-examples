/**
 * 상품 주소의 경로 값 — 상품 주소는 `/products/{상품번호}`다(이슈 #107). 상품번호(`productNo`)는 상점 안에서 유일한 숫자이고
 * 상품 상세 API(`GET /products/{productId}`)가 그대로 받는다. 번호가 없는 옛 응답만 상품 id를 쓰고, 상세 화면이 번호 주소로 옮긴다.
 * 장바구니·주문서 같은 서버 요청에는 여전히 `productId`를 보낸다(공개 계약). 이 값은 링크에만 쓴다.
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
