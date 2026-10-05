import type { ProductDetail } from "@sayren/storefront-sdk";

/**
 * 상품정보 제공고시(의류) 표 — 상품 데이터에 있는 값만 채우고, 없는 항목은 「상품 상세 참조」로 둔다.
 *
 * 스토어프론트 API에는 고시 항목 필드가 없다. 그래서 옵션 축(색상·사이즈)과 상세설명 HTML의 정해진 자리
 * (`<li>소재: …</li>`, `<h3>세탁 방법</h3><p>…</p>`)에서 읽는다. 상세설명은 셀러가 쓴 글이라 모양이 다르면 그 칸은 비운다.
 */

export interface NoticeRow {
  label: string;
  value: string;
}

export const NOTICE_FALLBACK = "상품 상세 참조";

const TAG = /<[^>]*>/g;
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

function plain(html: string): string {
  return html
    .replace(TAG, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}

/** `<li>라벨: 값</li>`의 값 */
function listValue(description: string, label: string): string | null {
  for (const match of description.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)) {
    const text = plain(match[1] ?? "");
    const prefix = `${label}:`;
    if (text.startsWith(prefix)) return text.slice(prefix.length).trim() || null;
  }
  return null;
}

/** `<h2|h3>제목</h…>` 바로 뒤 첫 문단 */
function sectionParagraph(description: string, heading: string): string | null {
  const pattern = new RegExp(
    `<h[23][^>]*>\\s*${heading}\\s*</h[23]>\\s*<p[^>]*>([\\s\\S]*?)</p>`,
    "i",
  );
  const match = description.match(pattern);
  return match ? plain(match[1] ?? "") || null : null;
}

function groupValues(product: Pick<ProductDetail, "optionGroups">, name: string): string | null {
  const group = product.optionGroups.find((g) => g.name === name);
  return group?.values.length ? group.values.map((v) => v.name).join(", ") : null;
}

export function productNoticeRows(
  product: Pick<ProductDetail, "description" | "optionGroups">,
  customerCenterPhone: string | null,
): NoticeRow[] {
  const description = product.description ?? "";
  const or = (value: string | null) => value ?? NOTICE_FALLBACK;
  return [
    { label: "제품 소재", value: or(listValue(description, "소재")) },
    { label: "색상", value: or(groupValues(product, "색상")) },
    { label: "치수", value: or(groupValues(product, "사이즈")) },
    { label: "제조사", value: NOTICE_FALLBACK },
    { label: "제조국", value: NOTICE_FALLBACK },
    {
      label: "세탁 방법 및 취급 시 주의사항",
      value: or(sectionParagraph(description, "세탁 방법")),
    },
    { label: "제조연월", value: NOTICE_FALLBACK },
    { label: "품질보증기준", value: NOTICE_FALLBACK },
    {
      label: "A/S 책임자와 전화번호",
      value: customerCenterPhone ? `고객센터 ${customerCenterPhone}` : NOTICE_FALLBACK,
    },
  ];
}
