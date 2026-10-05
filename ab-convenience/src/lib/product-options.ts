import {
  type AddonGroupView,
  type AddonSelection,
  type CustomInputEntry,
  type CustomInputView,
  customInputLength,
  normalizeCustomInputValue,
  parseCustomInputValue,
} from "@sayren/storefront-sdk";
import { m } from "../i18n";

/**
 * 상품 상세의 옵션 선택 — 조합 옵션(variant) + 추가 선택 + 직접 입력.
 *
 * 화면은 여기 있는 순수 함수로 합계 가격과 담기 전 검사를 한다. 가격·재고의 최종 판정은 서버가 다시 한다.
 * 글자 수와 입력값 정리는 서버와 같은 SDK 함수(`customInputLength`·`normalizeCustomInputValue`)를 쓴다.
 * 이 파일의 값은 담기 요청 본문(서버 함수)으로만 나간다. 직접 입력값은 구매자가 적은 글자라 URL에 싣지 않는다.
 */

export interface OptionSelection {
  /** 추가 선택 옵션명 id → 고른 값 id. 고르지 않았으면 "" */
  addons: Record<string, string>;
  /** 직접 입력 항목 id → 적은 값 */
  inputs: Record<string, string>;
}

/** 칸 key — 추가 선택 옵션명 id와 직접 입력 항목 id가 겹쳐도 섞이지 않게 접두사를 붙인다 */
export const addonKey = (groupId: string) => `addon-${groupId}`;
export const inputKey = (inputId: string) => `input-${inputId}`;

export interface SelectionProblem {
  /** 문제가 있는 칸 — `addonKey`·`inputKey` */
  key: string;
  message: string;
}

/** 고른 추가 선택 값 — 목록에 없는 값 id는 고르지 않은 것으로 본다 */
function chosenValue(group: AddonGroupView, selection: OptionSelection) {
  const valueId = selection.addons[group.groupId] ?? "";
  return group.values.find((value) => value.valueId === valueId) ?? null;
}

/** 한 개 가격 = 기준가 + 조합 추가금 + 고른 추가 선택 값의 추가금 */
export function unitPriceOf(
  basePrice: number,
  variantAdditionalPrice: number,
  addonGroups: AddonGroupView[],
  selection: OptionSelection,
): number {
  let price = basePrice + variantAdditionalPrice;
  for (const group of addonGroups) price += chosenValue(group, selection)?.additionalPrice ?? 0;
  return price;
}

/**
 * 조사 — 마지막 글자에 받침이 있으면 `withFinal`, 없으면 `withoutFinal`. 한글이 아니면(영문·숫자 등) 둘을 함께 적는다.
 * 옵션명은 셀러가 정하므로 문구를 고정할 수 없다.
 */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  const code = word.trim().charCodeAt(word.trim().length - 1);
  if (!(code >= 0xac00 && code <= 0xd7a3)) return `${word}${withFinal}(${withoutFinal})`;
  return `${word}${(code - 0xac00) % 28 ? withFinal : withoutFinal}`;
}

/** 담기 전 검사 — 필수 빠짐과 글자 수 초과를 칸마다 한 줄로 알려 준다. 서버도 같은 것을 다시 본다 */
export function selectionProblems(
  addonGroups: AddonGroupView[],
  customInputs: CustomInputView[],
  selection: OptionSelection,
): SelectionProblem[] {
  const problems: SelectionProblem[] = [];
  for (const group of addonGroups) {
    const value = chosenValue(group, selection);
    if (!value && group.required) {
      problems.push({
        key: addonKey(group.groupId),
        message: m.product_options_addon_required({ name: josa(group.name, "을", "를") }),
      });
    }
  }
  for (const input of customInputs) {
    const value = normalizeCustomInputValue(selection.inputs[input.inputId] ?? "");
    const problem = value
      ? inputValueProblem(input, value)
      : input.required
        ? m.product_options_input_required({ label: josa(input.label, "을", "를") })
        : null;
    if (problem) problems.push({ key: inputKey(input.inputId), message: problem });
  }
  return problems;
}

/** 담기 요청에 싣는 값 — 고르지 않은 추가 선택과 비운 입력은 뺀다 */
export function selectionPayload(
  addonGroups: AddonGroupView[],
  customInputs: CustomInputView[],
  selection: OptionSelection,
): { addons: AddonSelection[]; customInputs: CustomInputEntry[] } {
  const addons = addonGroups.flatMap((group) => {
    const value = chosenValue(group, selection);
    return value ? [{ groupId: group.groupId, valueId: value.valueId }] : [];
  });
  const inputs = customInputs
    .map((input) => ({
      inputId: input.inputId,
      value: payloadValue(input, selection.inputs[input.inputId] ?? ""),
    }))
    .filter((input) => input.value.length > 0);
  return { addons, customInputs: inputs };
}

/**
 * 추가 선택 첫 값 — 모두 비워 둔다. 필수는 「선택해 주십시오」가, 선택은 「선택 안 함」이 먼저 보인다.
 * 필수를 미리 골라 두면 구매자가 모르는 추가금이 붙는다.
 */
export function initialAddons(addonGroups: AddonGroupView[]): Record<string, string> {
  return Object.fromEntries(addonGroups.map((group) => [group.groupId, ""]));
}

/** 값 옆에 붙는 추가금 — 0원이면 붙이지 않는다 */
export function additionalPriceLabel(amount: number, format: (value: number) => string): string {
  if (amount === 0) return "";
  return amount > 0 ? ` (+${format(amount)})` : ` (-${format(-amount)})`;
}

/**
 * 직접 입력 타입 — `text`·`number`·`select`·`date`·`datetime`·`image`. 모르는 타입은 `text`로 본다(서버도 같다).
 * `image`의 `maxLength`는 글자 수가 아니라 최대 장수다
 */
export type InputKind = "text" | "number" | "select" | "date" | "datetime" | "image";

const INPUT_KINDS = new Set<InputKind>(["text", "number", "select", "date", "datetime", "image"]);

export function inputKindOf(input: Pick<CustomInputView, "type">): InputKind {
  return INPUT_KINDS.has(input.type as InputKind) ? (input.type as InputKind) : "text";
}

/** 이미지 입력값(줄바꿈으로 이은 주소) → 주소 목록 */
export function imageUrlsOf(value: string): string[] {
  return value.split(/\s+/).filter(Boolean);
}

/** 한 칸의 값 문제 — 서버와 같은 SDK 판정(`parseCustomInputValue`)을 쓴다. 문제가 없으면 null */
function inputValueProblem(input: CustomInputView, value: string): string | null {
  const kind = inputKindOf(input);
  if (kind === "image") {
    if (imageUrlsOf(value).length > input.maxLength)
      return m.product_options_input_too_many({
        label: josa(input.label, "은", "는"),
        max: input.maxLength,
      });
  } else if (kind === "text" || kind === "number") {
    if (customInputLength(value) > input.maxLength)
      return m.product_options_input_too_long({
        label: josa(input.label, "은", "는"),
        max: input.maxLength,
      });
  }
  return parseCustomInputValue(input.type, input.options, value) === null
    ? m.product_options_input_invalid({ label: josa(input.label, "을", "를") })
    : null;
}

/** 요청에 싣는 값 — 형식이 맞으면 서버가 저장할 모양(일시는 ISO, 이미지는 줄바꿈), 아니면 정리한 값 그대로 */
function payloadValue(input: CustomInputView, raw: string): string {
  const value = normalizeCustomInputValue(raw);
  if (!value) return value;
  return parseCustomInputValue(input.type, input.options, value) ?? value;
}

/** 한국 시간 일시 칸(`YYYY-MM-DDTHH:mm`) ↔ 오프셋 있는 ISO 값 — 서버는 오프셋 없는 일시를 받지 않는다 */
export function datetimeInputToValue(local: string): string {
  return local ? `${local}:00+09:00` : "";
}

export function datetimeValueToInput(value: string): string {
  const time = new Date(value);
  if (!value || Number.isNaN(time.getTime())) return "";
  return new Date(time.getTime() + 9 * 3_600_000).toISOString().slice(0, 16);
}
