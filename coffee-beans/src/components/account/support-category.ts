import type { CustomerInquiryCategory } from "@sayren/storefront-sdk";
import { m } from "../../i18n";

/** 1:1 문의 유형 라벨 — 명사구 */
export function supportCategoryLabel(category: CustomerInquiryCategory): string {
  switch (category) {
    case "DELIVERY":
      return m.support_cat_delivery();
    case "RETURN":
      return m.support_cat_return();
    case "EXCHANGE":
      return m.support_cat_exchange();
    case "PAYMENT":
      return m.support_cat_payment();
    default:
      return m.support_cat_etc();
  }
}
