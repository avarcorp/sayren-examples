import { BASE_CURRENCY, currencySpecOf, minorToMajor } from "@sayren/storefront-sdk";
import { m } from "../i18n";

const KRW = new Intl.NumberFormat("ko-KR");

/**
 * 통화 금액 — 금액은 그 통화의 최소 단위 정수다(API 응답 그대로, 화면에서 계산하지 않는다). 원화는 「12,000원」,
 * 그 밖의 통화는 `Intl` 통화 형식이다(「US$10.99」). 서버와 브라우저 결과가 같도록 로케일을 고정한다
 */
export function formatMoney(amount: number, currency: string = BASE_CURRENCY): string {
  if (currency === BASE_CURRENCY) return m.format_price({ amount: KRW.format(amount) });
  const { digits } = currencySpecOf(currency);
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(minorToMajor(amount, currency));
}
