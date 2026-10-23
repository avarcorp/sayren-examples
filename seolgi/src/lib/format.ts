/** 금액 표시 — 금액은 통화의 최소 단위다. 원화는 「12,000원」, 그 밖은 통화 기호 */
export function formatMoney(amount: number, currency = "KRW"): string {
  if (currency === "KRW") return `${amount.toLocaleString("ko-KR")}원`;
  const digits =
    new Intl.NumberFormat("ko-KR", { style: "currency", currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency }).format(
    amount / 10 ** digits,
  );
}

/** 휴대폰·전화번호 표시 — 01012345678 → 010-1234-5678. 모르는 형식은 그대로 */
export function formatPhone(value: string): string {
  const d = value.replace(/[^0-9]/g, "");
  if (/^01[0-9]{9}$/.test(d)) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (/^01[0-9]{8}$/.test(d)) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return value;
}
