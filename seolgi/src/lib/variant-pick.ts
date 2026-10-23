import type { ProductDetail } from "@sayren/storefront-sdk";

type Groups = ProductDetail["optionGroups"];
type Variants = ProductDetail["variants"];

/** 옵션 그룹 id → 고른 값 id */
export type ValuePicks = Record<string, string>;

/** 모든 그룹을 골랐으면 그 조합, 아니면 null. 옵션이 없는 상품은 조합도 없다 */
export function resolveVariant(groups: Groups, variants: Variants, picks: ValuePicks) {
  if (groups.length === 0) return null;
  const chosen = groups.map((g) => picks[g.groupId]);
  if (chosen.some((v) => !v)) return null;
  return variants.find((v) => chosen.every((id) => v.valueIds.includes(id as string))) ?? null;
}

/** 값이 든 조합 가운데 재고 있는 것이 하나라도 있는가. 「품절」 표기와 비활성화는 이것만 본다(서버 `soldOut`) */
export function valueInStock(variants: Variants, valueId: string) {
  return variants.some((v) => !v.soldOut && v.valueIds.includes(valueId));
}

function inStockWith(variants: Variants, valueIds: string[]) {
  return variants.some((v) => !v.soldOut && valueIds.every((id) => v.valueIds.includes(id)));
}

/**
 * 값 하나를 고른다. 이미 고른 다른 그룹 값과 재고 있는 조합이 없으면 그 값들을 비운다 —
 * 맞지 않는 값을 막아 두면 고른 값을 되돌릴 수단이 없어 재고 있는 조합에 닿지 못한다.
 */
export function pickValue(
  groups: Groups,
  variants: Variants,
  picks: ValuePicks,
  groupId: string,
  valueId: string,
): ValuePicks {
  const next: ValuePicks = { [groupId]: valueId };
  for (const g of groups) {
    const other = picks[g.groupId];
    if (g.groupId === groupId || !other) continue;
    if (inStockWith(variants, [...Object.values(next), other])) next[g.groupId] = other;
  }
  return next;
}

/** 값 옆 추가금 — 그 값을 넣은 조합들의 추가금이 모두 같을 때만 보인다(조합마다 다르면 고른 뒤 합계로 보인다) */
export function valueExtraPrice(variants: Variants, valueId: string): number | null {
  const prices = new Set(
    variants.filter((v) => v.valueIds.includes(valueId)).map((v) => v.additionalPrice),
  );
  if (prices.size !== 1) return null;
  const [only] = [...prices];
  return only ? only : null;
}
