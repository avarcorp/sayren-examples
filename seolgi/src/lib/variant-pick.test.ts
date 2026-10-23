import { describe, expect, it } from "vitest";
import { pickValue, resolveVariant, valueExtraPrice, valueInStock } from "./variant-pick";

const groups = [
  {
    groupId: "shape",
    name: "모양",
    values: [
      { valueId: "round", name: "원형" },
      { valueId: "bone", name: "뼈다귀" },
    ],
  },
  {
    groupId: "color",
    name: "색상",
    values: [
      { valueId: "gold", name: "골드" },
      { valueId: "silver", name: "실버" },
    ],
  },
];
const v = (variantId: string, valueIds: string[], additionalPrice: number, soldOut = false) => ({
  variantId,
  variantNo: variantId,
  valueIds,
  name: variantId,
  additionalPrice,
  soldOut,
});
const variants = [
  v("rg", ["round", "gold"], 0),
  v("rs", ["round", "silver"], 0, true),
  v("bg", ["bone", "gold"], 2000),
  v("bs", ["bone", "silver"], 2000),
];

describe("옵션 조합 고르기", () => {
  it("맞지 않는 값을 고르면 충돌한 선택을 비우고, 다 고르면 그 조합을 찾는다", () => {
    // 원형·실버만 품절 — 실버는 뼈다귀로 살 수 있어 막지 않는다
    expect(valueInStock(variants, "silver")).toBe(true);
    expect(pickValue(groups, variants, { shape: "round" }, "color", "silver")).toEqual({
      color: "silver",
    });
    expect(pickValue(groups, variants, { shape: "bone" }, "color", "silver")).toEqual({
      color: "silver",
      shape: "bone",
    });
    expect(resolveVariant(groups, variants, { shape: "bone" })).toBeNull();
    expect(resolveVariant(groups, variants, { shape: "bone", color: "silver" })?.variantId).toBe(
      "bs",
    );
    expect(valueExtraPrice(variants, "bone")).toBe(2000);
    expect(valueExtraPrice(variants, "gold")).toBeNull();
  });
});
