import type { CustomerInquiryCategory } from "@sayren/storefront-sdk";
import { lazyMessages, m } from "../../i18n";

/** 1:1 문의 유형 — 보증 수리는 「보증 수리·기타」(ETC)로 받는다 */
export const SUPPORT_CATEGORIES = [
  "ETC",
  "DELIVERY",
  "RETURN",
  "EXCHANGE",
  "PAYMENT",
] as const satisfies readonly CustomerInquiryCategory[];

export const SUPPORT_CATEGORY = lazyMessages<CustomerInquiryCategory>({
  ETC: () => m.support_category_ETC(),
  DELIVERY: () => m.support_category_DELIVERY(),
  RETURN: () => m.support_category_RETURN(),
  EXCHANGE: () => m.support_category_EXCHANGE(),
  PAYMENT: () => m.support_category_PAYMENT(),
});
