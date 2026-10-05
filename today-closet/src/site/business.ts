/**
 * 사업자 정보 예시 값 — 스토어프론트 `GET /store`에 값이 없을 때만 쓴다(`site/seller.ts`의 `sellerInfoOf`).
 * 셀러가 상점 정보(사업자 정보)를 저장하면 API 값이 이긴다.
 */
export const BUSINESS_INFO = {
  companyName: "오늘의옷장",
  ceo: "김오늘",
  businessNumber: "123-45-67890",
  mailOrderNumber: "제2026-서울성동-0000호",
  address: "서울특별시 성동구 성수이로 00, 3층",
  email: "help@todaycloset.example",
  phone: "1588-0000",
  businessHours: "평일 10:00~17:00 (점심 12:30~13:30, 주말·공휴일 휴무)",
  privacyOfficer: "김오늘",
  privacyOfficerEmail: "help@todaycloset.example",
} as const;

/**
 * 반품 받는 주소 — 스토어프론트 상점 정보에 반품지 주소가 없어 여기 둔다(출고지·반품지 API는 GAPS G2).
 * 반품·교환 배송비는 상품 상세 응답(`fulfillment.shipping`)을 쓴다.
 */
export const SHOP_POLICY = {
  returnAddress: "서울특별시 성동구 성수이로 00, 3층 오늘의옷장 반품 담당",
} as const;
