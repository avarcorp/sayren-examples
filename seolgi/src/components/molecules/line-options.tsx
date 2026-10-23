import type { Cart } from "@sayren/storefront-sdk";
import { formatDateTime } from "../../lib/dates";

type Line = Pick<Cart["items"][number], "optionSelections" | "customInputs">;

/**
 * 줄의 옵션 표시 (시안 DCart) — 「피치 / M · 원형 각인 이름표 추가」, 아래 줄에 「이름표 각인 · 설기」.
 * 장바구니·주문서·주문 상세가 같이 쓴다. 추가금은 줄 금액에 이미 들어 있다.
 */
export function LineOptions({ line }: { line: Line }) {
  const values = line.optionSelections.filter((o) => o.kind !== "addon").map((o) => o.valueName);
  const addons = line.optionSelections
    .filter((o) => o.kind === "addon")
    .map((o) => `${o.valueName} 추가`);
  const first = [values.join(" / "), ...addons].filter(Boolean).join(" · ");
  const inputs = line.customInputs.map(
    (c) =>
      `${c.label} ${c.type === "image" ? "이미지 첨부" : c.type === "datetime" ? formatDateTime(c.value) : c.value}`,
  );
  return (
    <>
      {first ? <span className="block text-muted text-small">{first}</span> : null}
      {inputs.length > 0 ? (
        <span className="block text-muted text-small">{inputs.join(" · ")}</span>
      ) : null}
    </>
  );
}
