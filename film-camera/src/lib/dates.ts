/** 날짜 표시 — 서버 ISO 시각을 브라우저 시간대의 「2026. 11. 7.」로 보인다. 서버 렌더와 같도록 로케일을 고정한다 */
const DATE = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});
const DATE_TIME = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string): string {
  return DATE.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}
