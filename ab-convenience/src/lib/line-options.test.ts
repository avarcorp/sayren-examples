import { describe, expect, it } from "vitest";
import { formatPrice } from "./format";
import { lineOptionRows } from "./line-options";

const rowsOf = (item: Parameters<typeof lineOptionRows>[0]) =>
  lineOptionRows(item, formatPrice).map((row) => [row.label, row.value]);

describe("줄 옵션 표시", () => {
  it("조합 → 추가 선택(추가금) → 직접 입력 순서로 한 줄씩 보인다", () => {
    expect(
      rowsOf({
        optionName: "블랙 / M",
        optionSelections: [
          { kind: "combination", groupName: "색상", valueName: "블랙", additionalPrice: 0 },
          { kind: "combination", groupName: "사이즈", valueName: "M", additionalPrice: 0 },
          { kind: "addon", groupName: "포장", valueName: "선물 포장", additionalPrice: 2500 },
          { kind: "addon", groupName: "카드", valueName: "없음", additionalPrice: 0 },
        ],
        customInputs: [{ label: "각인 문구", value: "HAPPY" }],
      }),
    ).toEqual([
      [null, "블랙 / M"],
      ["포장", "선물 포장 (+2,500원)"],
      ["카드", "없음"],
      ["각인 문구", "HAPPY"],
    ]);
  });

  it("조합 이름이 없으면 조합 칸 값을 잇는다. 모르는 방식은 추가 선택처럼 보인다", () => {
    expect(
      rowsOf({
        optionName: null,
        optionSelections: [
          { kind: "combination", groupName: "색상", valueName: "블랙", additionalPrice: 0 },
          { kind: "future", groupName: "보증", valueName: "1년", additionalPrice: 0 },
        ],
      }),
    ).toEqual([
      [null, "블랙"],
      ["보증", "1년"],
    ]);
  });

  it("옵션 선택 스냅샷이 없는 옛 줄은 조합 이름만, 옵션이 없으면 빈 목록이다", () => {
    expect(rowsOf({ optionName: "블랙 / M" })).toEqual([[null, "블랙 / M"]]);
    expect(rowsOf({ optionName: null })).toEqual([]);
  });
});
