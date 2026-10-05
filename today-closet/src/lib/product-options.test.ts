import type { AddonGroupView, CustomInputView } from "@sayren/storefront-sdk";
import { describe, expect, it } from "vitest";
import { formatPrice } from "./format";
import {
  additionalPriceLabel,
  initialAddons,
  josa,
  selectionPayload,
  selectionProblems,
  unitPriceOf,
} from "./product-options";

const packaging: AddonGroupView = {
  groupId: "g_pack",
  name: "포장",
  required: false,
  values: [
    { valueId: "v_basic", name: "기본 포장", additionalPrice: 0 },
    { valueId: "v_gift", name: "선물 포장", additionalPrice: 2500 },
  ],
};
const strap: AddonGroupView = {
  groupId: "g_strap",
  name: "스트랩",
  required: true,
  values: [{ valueId: "v_strap", name: "가죽", additionalPrice: 3000 }],
};
const engraving: CustomInputView = {
  inputId: "i_engrave",
  label: "각인 문구",
  placeholder: "영문·숫자 20자 이내",
  maxLength: 5,
  required: true,
};
const message: CustomInputView = {
  inputId: "i_msg",
  label: "선물 메시지",
  placeholder: null,
  maxLength: 100,
  required: false,
};

describe("상품 옵션 선택", () => {
  it("합계 가격은 기준가 + 조합 추가금 + 고른 추가 선택 추가금이다", () => {
    const selection = { addons: { g_pack: "v_gift", g_strap: "v_strap" }, inputs: {} };
    expect(unitPriceOf(29000, 4000, [packaging, strap], selection)).toBe(
      29000 + 4000 + 2500 + 3000,
    );
    // 고르지 않았거나 목록에 없는 값은 더하지 않는다
    expect(unitPriceOf(29000, 0, [packaging], { addons: { g_pack: "nope" }, inputs: {} })).toBe(
      29000,
    );
  });

  it("추가 선택은 처음에 모두 비어 있다 — 필수도 미리 고르지 않는다", () => {
    expect(initialAddons([packaging, strap])).toEqual({ g_pack: "", g_strap: "" });
  });

  it("필수 추가 선택·필수 입력이 빠지면 칸마다 알린다", () => {
    const problems = selectionProblems([packaging, strap], [engraving, message], {
      addons: initialAddons([packaging, strap]),
      inputs: { i_engrave: "   " },
    });
    expect(problems.map((problem) => problem.key)).toEqual(["addon-g_strap", "input-i_engrave"]);
  });

  it("글자 수 초과를 막는다. 글자 수는 SDK 규칙(제어 문자 → 공백, 앞뒤 공백 제거, 코드 포인트)이다", () => {
    const problems = selectionProblems([packaging], [engraving], {
      addons: { g_pack: "v_gift" },
      inputs: { i_engrave: "HAPPYY" },
    });
    expect(problems).toEqual([
      { key: "input-i_engrave", message: "각인 문구는 5자까지 입력할 수 있습니다" },
    ]);
    expect(
      selectionProblems([], [engraving], { addons: {}, inputs: { i_engrave: "  😀😀😀😀😀  " } }),
    ).toEqual([]);
    expect(
      selectionPayload([], [engraving], { addons: {}, inputs: { i_engrave: "HA\nPY" } }),
    ).toEqual({ addons: [], customInputs: [{ inputId: "i_engrave", value: "HA PY" }] });
  });

  it("요청 본문은 고른 값과 적은 값만 싣고 입력값의 앞뒤 공백을 걷는다", () => {
    expect(
      selectionPayload([packaging, strap], [engraving, message], {
        addons: { g_pack: "", g_strap: "v_strap" },
        inputs: { i_engrave: " HAPPY ", i_msg: "" },
      }),
    ).toEqual({
      addons: [{ groupId: "g_strap", valueId: "v_strap" }],
      customInputs: [{ inputId: "i_engrave", value: "HAPPY" }],
    });
  });

  it("조사는 받침으로 고르고, 한글로 끝나지 않으면 둘을 함께 적는다", () => {
    expect(josa("포장", "을", "를")).toBe("포장을");
    expect(josa("각인 문구", "을", "를")).toBe("각인 문구를");
    expect(josa("Size", "을", "를")).toBe("Size을(를)");
  });

  it("추가금 표시는 0원이면 붙이지 않는다", () => {
    expect(additionalPriceLabel(0, formatPrice)).toBe("");
    expect(additionalPriceLabel(2500, formatPrice)).toBe(" (+2,500원)");
    expect(additionalPriceLabel(-1000, formatPrice)).toBe(" (-1,000원)");
  });
});
