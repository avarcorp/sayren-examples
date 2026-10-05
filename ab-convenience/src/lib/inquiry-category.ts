import type { PublicInquiry } from "@sayren/storefront-sdk";
import { lazyMessages, m } from "../i18n";

/** 상품 문의 유형 — 값은 storefront-sdk 0.18.2의 상품 문의 유형이다(생략하면 서버가 PRODUCT로 둔다) */
export type InquiryCategory = PublicInquiry["category"];

export const INQUIRY_CATEGORIES: readonly InquiryCategory[] = [
  "PRODUCT",
  "DELIVERY",
  "RETURN",
  "EXCHANGE",
  "ETC",
];

export const INQUIRY_CATEGORY_LABELS = lazyMessages<InquiryCategory>({
  PRODUCT: () => m.inquiry_category_PRODUCT(),
  DELIVERY: () => m.inquiry_category_DELIVERY(),
  RETURN: () => m.inquiry_category_RETURN(),
  EXCHANGE: () => m.inquiry_category_EXCHANGE(),
  ETC: () => m.inquiry_category_ETC(),
});
