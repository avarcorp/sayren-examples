/**
 * 쿠폰 안내 콘텐츠 — 상점이 관리 API로 만든 코드 입력형 쿠폰(WELCOME3000·TODAY10)의 안내 문구다.
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

export const COUPON_PROMOTIONS: readonly CouponPromotion[] = [
  {
    code: "WELCOME3000",
    name: "신규 회원 3,000원 할인",
    benefit: "3,000원 할인",
    condition: "30,000원 이상 구매 시 · 회원 1인 1회",
    period: "2026년 12월 31일까지",
  },
  {
    code: "TODAY10",
    name: "가을 시즌 10% 할인",
    benefit: "10% 할인 (최대 5,000원)",
    condition: "전 상품 · 회원 1인 1회",
    period: "2026년 10월 31일까지",
  },
];
