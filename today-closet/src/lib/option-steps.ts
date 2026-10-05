import type { ProductDetail } from "@sayren/storefront-sdk";

/**
 * 상품 상세의 단계형 옵션과 선택 행 — 화면 상태를 바꾸는 순수 함수만 둔다(테스트가 고정한다).
 *
 * - 옵션 축(`optionGroups`)을 순서대로 고른다. 앞 단계를 골라야 다음 단계가 열린다.
 * - 값이 품절인지는 「지금까지 고른 값 + 이 값」으로 시작하는 조합 중 살 수 있는 것이 있는지로 정한다.
 * - 마지막 단계까지 고르면 그 조합이 선택 행으로 쌓이고 단계는 처음으로 돌아간다. 같은 조합은 행을 늘리지 않고 수량을 올린다.
 * - 옵션이 없는 상품은 조합 하나가 처음부터 한 행으로 있다(지울 수 없다).
 *
 * 가격·재고의 최종 판정은 서버가 담기·주문서에서 다시 한다.
 */

type Variant = ProductDetail["variants"][number];
type OptionProduct = Pick<ProductDetail, "optionGroups" | "variants">;

/** 한 조합의 최대 수량 — 화면에서 막는 값이다 */
export const MAX_LINE_QUANTITY = 99;

export interface PurchaseLine {
  variantId: string;
  quantity: number;
}

export interface PurchaseState {
  /** 단계마다 고른 값 id — 길이가 곧 지금 단계다 */
  chosen: string[];
  lines: PurchaseLine[];
}

export interface StepValue {
  valueId: string;
  name: string;
  soldOut: boolean;
  /** 마지막 단계에서만 — 그 조합의 추가금 */
  additionalPrice: number | null;
}

export function hasOptionSteps(product: OptionProduct): boolean {
  return product.optionGroups.length > 0;
}

function startsWith(variant: Variant, prefix: readonly string[]): boolean {
  return prefix.every((valueId, i) => variant.valueIds[i] === valueId);
}

/** 고른 값 id들(단계 순서)로 조합을 찾는다 */
export function variantOf(product: OptionProduct, valueIds: readonly string[]): Variant | null {
  if (valueIds.length !== product.optionGroups.length) return null;
  return product.variants.find((variant) => startsWith(variant, valueIds)) ?? null;
}

/** 단계 `step`의 값 목록 — 앞 단계에서 고른 값(`chosen`)으로 품절을 가린다 */
export function stepValues(
  product: OptionProduct,
  step: number,
  chosen: readonly string[],
): StepValue[] {
  const group = product.optionGroups[step];
  if (!group) return [];
  const prefix = chosen.slice(0, step);
  const last = step === product.optionGroups.length - 1;
  return group.values
    .map((value) => {
      const candidates = product.variants.filter((variant) =>
        startsWith(variant, [...prefix, value.valueId]),
      );
      if (candidates.length === 0) return null;
      const variant = last ? candidates[0] : null;
      return {
        valueId: value.valueId,
        name: value.name,
        soldOut: candidates.every((candidate) => candidate.soldOut),
        additionalPrice: variant ? variant.additionalPrice : null,
      };
    })
    .filter((value): value is StepValue => value !== null);
}

/** 단계를 열 수 있는가 — 첫 단계는 늘, 다음 단계는 앞 단계를 고른 뒤 */
export function stepEnabled(step: number, chosen: readonly string[]): boolean {
  return step === 0 || chosen.length >= step;
}

/** 처음 상태 — 옵션이 없는 상품은 살 수 있으면 한 행을 둔다 */
export function initialPurchaseState(product: OptionProduct): PurchaseState {
  if (hasOptionSteps(product)) return { chosen: [], lines: [] };
  const only = product.variants[0];
  return {
    chosen: [],
    lines: only && !only.soldOut ? [{ variantId: only.variantId, quantity: 1 }] : [],
  };
}

/** 같은 조합이 있으면 수량을 올리고, 없으면 행을 더한다 */
export function addLine(lines: readonly PurchaseLine[], variantId: string): PurchaseLine[] {
  const found = lines.find((line) => line.variantId === variantId);
  if (!found) return [...lines, { variantId, quantity: 1 }];
  return lines.map((line) =>
    line.variantId === variantId
      ? { ...line, quantity: Math.min(MAX_LINE_QUANTITY, line.quantity + 1) }
      : line,
  );
}

/**
 * 단계 `step`에서 값을 고른다. 품절 값·닫힌 단계·없는 값은 상태를 바꾸지 않는다.
 * 마지막 단계면 조합을 선택 행으로 쌓고 단계를 처음으로 되돌린다.
 */
export function chooseValue(
  product: OptionProduct,
  state: PurchaseState,
  step: number,
  valueId: string,
): PurchaseState {
  if (!stepEnabled(step, state.chosen)) return state;
  const value = stepValues(product, step, state.chosen).find((v) => v.valueId === valueId);
  if (!value || value.soldOut) return state;
  const chosen = [...state.chosen.slice(0, step), valueId];
  if (chosen.length < product.optionGroups.length) return { ...state, chosen };
  const variant = variantOf(product, chosen);
  if (!variant || variant.soldOut) return state;
  return { chosen: [], lines: addLine(state.lines, variant.variantId) };
}

/** 수량 바꾸기 — 1~최대 수량으로 맞춘다 */
export function setLineQuantity(
  state: PurchaseState,
  variantId: string,
  quantity: number,
): PurchaseState {
  const next = Math.max(1, Math.min(MAX_LINE_QUANTITY, Math.floor(quantity) || 1));
  return {
    ...state,
    lines: state.lines.map((line) =>
      line.variantId === variantId ? { ...line, quantity: next } : line,
    ),
  };
}

export function removeLine(state: PurchaseState, variantId: string): PurchaseState {
  return { ...state, lines: state.lines.filter((line) => line.variantId !== variantId) };
}

/** 선택 행의 합계 — 한 개 가격은 기준가 + 조합 추가금 + 공통 추가금(추가 선택) */
export function purchaseTotals(
  product: OptionProduct,
  lines: readonly PurchaseLine[],
  basePrice: number,
  extraPerUnit = 0,
): { count: number; amount: number } {
  let count = 0;
  let amount = 0;
  for (const line of lines) {
    const variant = product.variants.find((v) => v.variantId === line.variantId);
    if (!variant) continue;
    count += line.quantity;
    amount += (basePrice + variant.additionalPrice + extraPerUnit) * line.quantity;
  }
  return { count, amount };
}

/**
 * 목록 상자의 키보드 이동 — 품절(비활성) 값은 건너뛴다. 움직일 곳이 없으면 지금 위치를 돌려준다.
 * `current`가 -1이면 아직 아무 것도 가리키지 않는 상태다.
 */
export function nextActiveIndex(
  disabled: readonly boolean[],
  current: number,
  key: "ArrowDown" | "ArrowUp" | "Home" | "End",
): number {
  const n = disabled.length;
  const enabled = (i: number) => i >= 0 && i < n && !disabled[i];
  if (key === "Home") return disabled.findIndex((d) => !d);
  if (key === "End") {
    for (let i = n - 1; i >= 0; i--) if (enabled(i)) return i;
    return -1;
  }
  const step = key === "ArrowDown" ? 1 : -1;
  for (let i = current + step; i >= 0 && i < n; i += step) if (enabled(i)) return i;
  return current;
}
