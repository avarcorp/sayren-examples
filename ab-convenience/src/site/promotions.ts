/**
 * 쿠폰 안내 콘텐츠 — 상점이 관리 API로 만든 코드 입력형 쿠폰의 안내 문구다. AB편의점은 아직 쿠폰이 없다.
 * 스토어프론트 API에 상점의 공개 쿠폰 목록이 없어(GAPS G21) 쿠폰을 만들거나 바꾸면 여기도 같이 고친다.
 * 할인액은 주문서에서 서버 금액 미리보기(`checkout.pricing`)가 정한다 — 이 값으로 금액을 계산하지 않는다.
 */
export interface CouponPromotion {
  code: string;
  name: string;
  /** 혜택 요약(표시용 문장) */
  benefit: string;
  condition: string;
  period: string;
}

export const COUPON_PROMOTIONS: readonly CouponPromotion[] = [];
