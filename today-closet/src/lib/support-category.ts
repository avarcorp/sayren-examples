import {
  type CustomerInquiryCategory,
  customerInquiryCategorySchema,
} from "@sayren/storefront-sdk";
import { lazyMessages, m } from "../i18n";

/** 1:1 문의 유형 — 값은 SDK 스키마가 원천이다 */
export const SUPPORT_CATEGORIES = customerInquiryCategorySchema.options;

export const SUPPORT_CATEGORY_LABELS = lazyMessages<CustomerInquiryCategory>({
  RETURN: () => m.support_category_RETURN(),
  EXCHANGE: () => m.support_category_EXCHANGE(),
  DELIVERY: () => m.support_category_DELIVERY(),
  PAYMENT: () => m.support_category_PAYMENT(),
  ETC: () => m.support_category_ETC(),
});
