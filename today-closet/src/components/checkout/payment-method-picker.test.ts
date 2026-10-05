import type { AvailablePaymentOption } from "@sayren/storefront-sdk";
import { describe, expect, it } from "vitest";
import { groupEasyPayProviders, groupPaymentOptions } from "./payment-method-picker";

const option = (value: Partial<AvailablePaymentOption> & Pick<AvailablePaymentOption, "method">) =>
  ({
    pg: "tosspayments",
    label: value.method,
    pgName: "토스페이먼츠",
    ...value,
  }) as AvailablePaymentOption;

describe("결제수단 묶음", () => {
  it("결제수단 순서(카드 → 간편결제 → 가상계좌 → 계좌이체 → 휴대폰)로 묶고 빈 묶음은 뺀다", () => {
    const groups = groupPaymentOptions([
      option({ method: "BANK_TRANSFER" }),
      option({ method: "EASY_PAY", provider: "KAKAOPAY", label: "카카오페이" }),
      option({ method: "CARD" }),
      option({ method: "EASY_PAY", provider: "NAVERPAY", label: "네이버페이" }),
    ]);
    expect(groups.map((group) => group.method)).toEqual(["CARD", "EASY_PAY", "BANK_TRANSFER"]);
  });

  it("묶음 안에서는 서버가 준 순서를 지킨다", () => {
    const [easyPay] = groupPaymentOptions([
      option({ method: "EASY_PAY", provider: "KAKAOPAY", label: "카카오페이" }),
      option({ method: "EASY_PAY", provider: "NAVERPAY", label: "네이버페이" }),
    ]);
    expect(easyPay?.options.map((item) => item.label)).toEqual(["카카오페이", "네이버페이"]);
  });
});

describe("간편결제 결제사 묶음", () => {
  it("결제사마다 타일 하나로 묶고, PG 여럿은 그 안에 처음 나온 순서로 둔다", () => {
    const groups = groupEasyPayProviders([
      option({ method: "EASY_PAY", provider: "NAVERPAY", pg: "portone", pgName: "포트원" }),
      option({ method: "EASY_PAY", provider: "KAKAOPAY", pg: "portone", pgName: "포트원" }),
      option({ method: "EASY_PAY", provider: "NAVERPAY", pg: "tosspayments" }),
      option({ method: "CARD" }),
    ]);
    expect(groups.map((group) => group.provider)).toEqual(["NAVERPAY", "KAKAOPAY"]);
    expect(groups[0]?.options.map((item) => item.pg)).toEqual(["portone", "tosspayments"]);
  });
});
