import { BASE_CURRENCY, currencySpecOf, formatOrderNo, minorToMajor } from "@sayren/storefront-sdk";
import { m } from "../i18n";

const KRW = new Intl.NumberFormat("ko-KR");

/**
 * 통화 금액 — 금액은 그 통화의 최소 단위 정수다(API 응답 그대로, 화면에서 계산하지 않는다). 원화는 「12,000원」,
 * 그 밖의 통화는 `Intl` 통화 형식이다. 서버와 브라우저 결과가 같도록 로케일을 고정한다
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

/**
 * 날짜 — 서버 렌더와 브라우저 하이드레이션이 같은 글자를 그리도록 한국 시간대로 고정한다(받는 쪽 시간대를 모르는 렌더)
 */
const DATE = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const DATE_TIME = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : DATE.format(date);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : DATE_TIME.format(date);
}

/** 주문 번호 — 4자리씩 끊는다. 번호가 없는 옛 주문은 null */
export function orderNumber(orderNo: string | null): string | null {
  return orderNo ? formatOrderNo(orderNo) : null;
}
