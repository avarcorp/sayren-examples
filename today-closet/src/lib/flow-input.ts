import type { FlowAction, OrderStep } from "@sayren/storefront-sdk";
import { m } from "../i18n";
import { formatDateTime } from "./format";

/**
 * 주문 흐름 행동 입력(#115) — 서버가 버튼마다 준 입력 칸(`action.input`)을 폼 값에서 서버 형식으로 모은다. 판정은 서버다
 * (400 `FLOW_ACTION_INPUT_INVALID`). 값 모양: checkbox는 고른 선택지 배열, boolean은 참거짓, datetime은 `+09:00` ISO
 */
export type FlowInputField = NonNullable<FlowAction["input"]>[number];
export type FlowInputValue = string | number | boolean | string[];

/** 폼에서 칸 값 모으기 — 사진 칸은 따로 올린 주소를 받는다(`images`). 비운 칸은 뺀다 */
export function flowInputFromForm(
  fields: readonly FlowInputField[],
  form: FormData,
  images: Record<string, string[]> = {},
): Record<string, FlowInputValue> {
  const input: Record<string, FlowInputValue> = {};
  for (const field of fields) {
    if (field.type === "image") {
      if (images[field.key]?.length) input[field.key] = images[field.key] as string[];
      continue;
    }
    if (field.type === "checkbox") {
      const picked = form.getAll(field.key).map(String);
      if (picked.length) input[field.key] = picked;
      continue;
    }
    if (field.type === "boolean") {
      input[field.key] = form.get(field.key) === "on";
      continue;
    }
    const raw = String(form.get(field.key) ?? "").trim();
    if (raw === "") continue;
    if (field.type === "number") input[field.key] = Number(raw);
    else if (field.type === "datetime") input[field.key] = `${raw}:00+09:00`;
    else input[field.key] = raw;
  }
  return input;
}

type StepInput = NonNullable<OrderStep["inputs"]>["values"][number];

/** 상태에 남은 입력값 한 칸의 표시 — 사진은 따로 그린다 */
export function flowInputText(input: StepInput): string {
  const { value } = input;
  // 이름 붙인 선택지는 서버가 이름을 싣는다(`display`)
  if (input.display) return input.display;
  if (input.type === "boolean")
    return value === true ? m.order_flow_input_yes() : m.order_flow_input_no();
  if (input.type === "datetime" && typeof value === "string") return formatDateTime(value);
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}
