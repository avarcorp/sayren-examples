import type { AvailablePaymentOption } from "@sayren/storefront-sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  forgetPaymentOptions,
  recallPaymentOptions,
  rememberPaymentOptions,
} from "./payment-options";

const OPTIONS = [
  { pg: "tosspayments", method: "CARD", label: "신용·체크카드", pgName: "토스페이먼츠" },
  {
    pg: "portone",
    method: "EASY_PAY",
    provider: "KAKAOPAY",
    label: "카카오페이",
    pgName: "포트원",
  },
] as AvailablePaymentOption[];

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

describe("결제 재시도 옵션 보관", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { sessionStorage: memoryStorage() });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("결제 id별로 남기고 되읽는다", () => {
    rememberPaymentOptions("pay_1", OPTIONS);
    expect(recallPaymentOptions("pay_1")).toEqual(OPTIONS);
    expect(recallPaymentOptions("pay_2")).toEqual([]);
    forgetPaymentOptions("pay_1");
    expect(recallPaymentOptions("pay_1")).toEqual([]);
  });

  it("형식이 깨진 값이나 저장소 오류는 빈 목록이다", () => {
    window.sessionStorage.setItem("sayren.paymentOptions.pay_x", "{not json");
    expect(recallPaymentOptions("pay_x")).toEqual([]);
    vi.stubGlobal("window", {
      get sessionStorage(): Storage {
        throw new Error("blocked");
      },
    });
    expect(() => rememberPaymentOptions("pay_1", OPTIONS)).not.toThrow();
    expect(recallPaymentOptions("pay_1")).toEqual([]);
  });
});
