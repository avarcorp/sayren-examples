import { m } from "../i18n";

const KRW = new Intl.NumberFormat("ko-KR");

export function formatPrice(amount: number): string {
  return m.format_price({ amount: KRW.format(amount) });
}

/**
 * 서버가 그린 글자와 하이드레이션 결과가 같아야 한다. 그래서 시간대를 고정하고(서버는 대개 UTC), 로케일 문구
 * ("오후" 같은 말)는 쓰지 않고 숫자만 조립한다. 로케일 데이터가 적게 들어간 Node 빌드에서도 결과가 같다.
 * 다른 나라 구매자를 받으면 `TIME_ZONE`을 바꾼다.
 */
const TIME_ZONE = "Asia/Seoul";

const DATE_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** `2026. 9. 24. 22:05` */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const parts: Record<string, string> = {};
  for (const part of DATE_PARTS.formatToParts(new Date(value))) parts[part.type] = part.value;
  return `${parts.year}. ${parts.month}. ${parts.day}. ${parts.hour}:${parts.minute}`;
}
