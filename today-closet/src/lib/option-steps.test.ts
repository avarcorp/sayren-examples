import { describe, expect, it } from "vitest";
import {
  addLine,
  chooseValue,
  initialPurchaseState,
  MAX_LINE_QUANTITY,
  nextActiveIndex,
  type PurchaseState,
  purchaseTotals,
  removeLine,
  setLineQuantity,
  stepEnabled,
  stepValues,
} from "./option-steps";

/** 색상(레드·블랙) × 사이즈(S·M·L). 블랙은 전부 품절, 레드 L만 품절, 레드 M은 추가금 2,000원 */
const product = {
  optionGroups: [
    {
      groupId: "g-color",
      name: "색상",
      values: [
        { valueId: "red", name: "레드" },
        { valueId: "black", name: "블랙" },
      ],
    },
    {
      groupId: "g-size",
      name: "사이즈",
      values: [
        { valueId: "s", name: "S" },
        { valueId: "m", name: "M" },
        { valueId: "l", name: "L" },
      ],
    },
  ],
  variants: [
    {
      variantId: "v-rs",
      variantNo: null,
      valueIds: ["red", "s"],
      name: "레드 / S",
      additionalPrice: 0,
      soldOut: false,
    },
    {
      variantId: "v-rm",
      variantNo: null,
      valueIds: ["red", "m"],
      name: "레드 / M",
      additionalPrice: 2000,
      soldOut: false,
    },
    {
      variantId: "v-rl",
      variantNo: null,
      valueIds: ["red", "l"],
      name: "레드 / L",
      additionalPrice: 0,
      soldOut: true,
    },
    {
      variantId: "v-bs",
      variantNo: null,
      valueIds: ["black", "s"],
      name: "블랙 / S",
      additionalPrice: 0,
      soldOut: true,
    },
    {
      variantId: "v-bm",
      variantNo: null,
      valueIds: ["black", "m"],
      name: "블랙 / M",
      additionalPrice: 0,
      soldOut: true,
    },
  ],
};

describe("단계형 옵션", () => {
  it("첫 단계만 열려 있고, 앞 단계를 고르면 다음 단계가 열린다", () => {
    const start = initialPurchaseState(product);
    expect(stepEnabled(0, start.chosen)).toBe(true);
    expect(stepEnabled(1, start.chosen)).toBe(false);
    const afterColor = chooseValue(product, start, 0, "red");
    expect(afterColor.chosen).toEqual(["red"]);
    expect(stepEnabled(1, afterColor.chosen)).toBe(true);
  });

  it("닫힌 단계에서 고르면 상태가 그대로다", () => {
    const start = initialPurchaseState(product);
    expect(chooseValue(product, start, 1, "s")).toBe(start);
  });

  it("모든 조합이 품절인 값은 품절로 보이고 고를 수 없다", () => {
    const values = stepValues(product, 0, []);
    expect(values.map((v) => [v.name, v.soldOut])).toEqual([
      ["레드", false],
      ["블랙", true],
    ]);
    const start = initialPurchaseState(product);
    expect(chooseValue(product, start, 0, "black")).toBe(start);
  });

  it("마지막 단계는 앞에서 고른 값 기준으로 품절·추가금을 보인다. 없는 조합은 목록에서 뺀다", () => {
    expect(stepValues(product, 1, ["red"])).toEqual([
      { valueId: "s", name: "S", soldOut: false, additionalPrice: 0 },
      { valueId: "m", name: "M", soldOut: false, additionalPrice: 2000 },
      { valueId: "l", name: "L", soldOut: true, additionalPrice: 0 },
    ]);
    expect(stepValues(product, 1, ["black"]).map((v) => v.valueId)).toEqual(["s", "m"]);
  });

  it("마지막 단계까지 고르면 선택 행이 쌓이고 단계가 처음으로 돌아간다", () => {
    let state = initialPurchaseState(product);
    state = chooseValue(product, state, 0, "red");
    state = chooseValue(product, state, 1, "m");
    expect(state).toEqual({ chosen: [], lines: [{ variantId: "v-rm", quantity: 1 }] });
  });

  it("품절 조합(마지막 단계)은 행을 만들지 않는다", () => {
    const picked = chooseValue(product, initialPurchaseState(product), 0, "red");
    expect(chooseValue(product, picked, 1, "l")).toBe(picked);
  });

  it("같은 조합을 다시 고르면 행을 늘리지 않고 수량을 올린다", () => {
    let state = initialPurchaseState(product);
    for (let i = 0; i < 2; i++) {
      state = chooseValue(product, state, 0, "red");
      state = chooseValue(product, state, 1, "s");
    }
    state = chooseValue(product, state, 0, "red");
    state = chooseValue(product, state, 1, "m");
    expect(state.lines).toEqual([
      { variantId: "v-rs", quantity: 2 },
      { variantId: "v-rm", quantity: 1 },
    ]);
  });

  it("수량은 1~최대 수량으로 맞추고, 행을 지울 수 있다", () => {
    let state: PurchaseState = { chosen: [], lines: addLine([], "v-rs") };
    state = setLineQuantity(state, "v-rs", 0);
    expect(state.lines[0]?.quantity).toBe(1);
    state = setLineQuantity(state, "v-rs", 1000);
    expect(state.lines[0]?.quantity).toBe(MAX_LINE_QUANTITY);
    expect(addLine(state.lines, "v-rs")[0]?.quantity).toBe(MAX_LINE_QUANTITY);
    expect(removeLine(state, "v-rs").lines).toEqual([]);
  });

  it("총 개수·총 금액은 조합 추가금을 더해 계산한다", () => {
    const lines = [
      { variantId: "v-rs", quantity: 2 },
      { variantId: "v-rm", quantity: 1 },
    ];
    expect(purchaseTotals(product, lines, 79000)).toEqual({
      count: 3,
      amount: 79000 * 2 + 81000,
    });
  });

  it("옵션이 없는 상품은 처음부터 한 행이 있다(품절이면 없다)", () => {
    const single = {
      optionGroups: [],
      variants: [
        {
          variantId: "only",
          variantNo: null,
          valueIds: [],
          name: "",
          additionalPrice: 0,
          soldOut: false,
        },
      ],
    };
    expect(initialPurchaseState(single).lines).toEqual([{ variantId: "only", quantity: 1 }]);
    const soldOut = {
      ...single,
      variants: [{ ...single.variants[0], soldOut: true }],
    } as typeof single;
    expect(initialPurchaseState(soldOut).lines).toEqual([]);
  });
});

describe("목록 상자 키보드 이동", () => {
  const disabled = [false, true, false, true];
  it("아래·위 화살표는 비활성 값을 건너뛴다", () => {
    expect(nextActiveIndex(disabled, -1, "ArrowDown")).toBe(0);
    expect(nextActiveIndex(disabled, 0, "ArrowDown")).toBe(2);
    expect(nextActiveIndex(disabled, 2, "ArrowDown")).toBe(2);
    expect(nextActiveIndex(disabled, 2, "ArrowUp")).toBe(0);
  });
  it("Home·End는 처음·마지막 활성 값으로 간다", () => {
    expect(nextActiveIndex(disabled, 2, "Home")).toBe(0);
    expect(nextActiveIndex(disabled, 0, "End")).toBe(2);
    expect(nextActiveIndex([true, true], -1, "End")).toBe(-1);
  });
});
