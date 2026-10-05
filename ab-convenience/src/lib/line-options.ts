import type { CustomInputValueView, OptionSelectionView, StayView } from "@sayren/storefront-sdk";
import { m } from "../i18n";
import { additionalPriceLabel } from "./product-options";

/** 줄(장바구니·주문서·주문상품)이 싣는 옵션 표시 값 — 담을 때·주문할 때의 이름과 금액이다 */
export interface LineOptionSource {
  optionName: string | null;
  optionSelections?: OptionSelectionView[];
  customInputs?: CustomInputValueView[];
  /** 숙박 기간(날짜별 재고 상품) */
  stay?: StayView;
}

export interface LineOptionRow {
  key: string;
  /** 항목명. 조합 옵션은 이름 없이 값만 보인다(`블랙 / M`) */
  label: string | null;
  value: string;
  /** 이미지 입력의 사진 주소 — 값 대신 작은 사진으로 보인다 */
  images?: string[];
}

/** 조합 옵션 칸 — 값만 ` / `로 잇는다. 조합 추가금은 단가에 들어 있어 붙이지 않는다 */
const COMBINATION = "combination";

/**
 * 조합 옵션(`블랙 / M`) → 추가 선택(`포장: 선물 포장 (+2,500원)`) → 직접 입력(`각인 문구: HAPPY`) 순서로 한 줄씩 만든다.
 * 조합 이름은 `optionName`을 먼저 쓰고, 없으면 조합 칸 값을 잇는다. 모르는 방식(`kind`)의 칸은 추가 선택처럼 보인다.
 */
export function lineOptionRows(
  item: LineOptionSource,
  format: (amount: number) => string,
): LineOptionRow[] {
  const rows: LineOptionRow[] = [];
  const selections = item.optionSelections ?? [];
  const combination =
    item.optionName ||
    selections
      .filter((selection) => selection.kind === COMBINATION)
      .map((selection) => selection.valueName)
      .join(" / ");
  if (combination) rows.push({ key: "combination", label: null, value: combination });
  selections.forEach((selection, index) => {
    if (selection.kind === COMBINATION) return;
    rows.push({
      key: `selection-${index}`,
      label: selection.groupName,
      value: `${selection.valueName}${additionalPriceLabel(selection.additionalPrice, format)}`,
    });
  });
  if (item.stay) {
    rows.push({
      key: "stay",
      label: m.line_options_stay(),
      value: m.line_options_stay_value({
        checkIn: item.stay.checkIn.replaceAll("-", "."),
        checkOut: item.stay.checkOut.slice(5).replaceAll("-", "."),
        nights: item.stay.nights.length,
      }),
    });
  }
  (item.customInputs ?? []).forEach((input, index) => {
    const key = `input-${index}`;
    if (input.type === "image") {
      const images = input.value.split(/\s+/).filter(Boolean);
      rows.push({
        key,
        label: input.label,
        value: m.line_options_images({ count: images.length }),
        images,
      });
    } else if (input.type === "datetime") {
      rows.push({ key, label: input.label, value: koreanDateTime(input.value) });
    } else {
      rows.push({ key, label: input.label, value: input.value });
    }
  });
  return rows;
}

/** UTC ISO 일시 → 한국 시간 `2026.10.12 15:00`. 읽을 수 없으면 그대로 */
export function koreanDateTime(value: string): string {
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return value;
  const kst = new Date(time.getTime() + 9 * 3_600_000).toISOString();
  return `${kst.slice(0, 10).replaceAll("-", ".")} ${kst.slice(11, 16)}`;
}
