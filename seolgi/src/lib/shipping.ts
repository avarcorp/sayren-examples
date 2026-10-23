import type { ProductDetail } from "@sayren/storefront-sdk";
import { formatMoney } from "./format";

type Shipping = Extract<ProductDetail["fulfillment"], { type: "SHIPPING" }>["shipping"];

/** 배송비 글 — 「3,000원 · 30,000원 이상 무료」. 값은 상품 응답 그대로다 */
export function shippingText(s: Shipping): string {
  if (s.deliveryType === "FREE") return "무료배송";
  const fee = formatMoney(s.deliveryFee);
  if (s.deliveryType === "CONDITIONAL_FREE" && s.conditionalFreeAmount) {
    return `${fee} · ${formatMoney(s.conditionalFreeAmount)} 이상 무료`;
  }
  return fee;
}

/** 구매 버튼 아래 배송 안내 줄 — 배송비·배송 기간·교환/반품 기간 */
export function deliveryRows(product: ProductDetail): { label: string; value: string }[] {
  const s = product.fulfillment.type === "SHIPPING" ? product.fulfillment.shipping : null;
  return [
    ...(s ? [{ label: "배송", value: product.freeShipping ? "무료배송" : shippingText(s) }] : []),
    ...(s?.estimatedDays
      ? [{ label: "출고", value: `결제 후 ${s.estimatedDays} 안에 보냅니다` }]
      : []),
    { label: "교환", value: `받은 날부터 ${product.returnPeriodDays}일 안에 신청합니다` },
  ];
}
