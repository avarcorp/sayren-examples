import { describe, expect, it } from "vitest";
import { checkoutFormSchema, guestOrderLookupSchema, signupFormSchema } from "./form-schemas";

const messageOf = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe("가입 폼", () => {
  const valid = {
    email: " buyer@example.com ",
    password: "password-1",
    name: "구매자",
    phone: "",
    agreements: { terms: true, privacy: true, marketing: false },
  };

  it("앞뒤 공백을 지우고 휴대폰은 비워 둘 수 있다", () => {
    const parsed = signupFormSchema.parse(valid);
    expect(parsed.email).toBe("buyer@example.com");
    expect(parsed.phone).toBe("");
  });

  it("비밀번호 조합은 SDK 규칙으로 막는다", () => {
    expect(messageOf(signupFormSchema.safeParse({ ...valid, password: "aaaaaaaaaa" }))).toBe(
      "영문/숫자/특수문자 중 2종 이상을 조합해야 합니다",
    );
  });

  it("필수 동의가 없으면 안내한다", () => {
    const result = signupFormSchema.safeParse({
      ...valid,
      agreements: { terms: false, privacy: true, marketing: false },
    });
    expect(messageOf(result)).toBe("필수 약관에 동의해 주십시오");
  });
});

describe("비회원 주문 조회 폼", () => {
  it("연락처는 숫자만 남긴다", () => {
    const parsed = guestOrderLookupSchema.parse({
      orderId: " ord_1 ",
      phone: "010-1234-5678",
      orderPassword: "secret",
    });
    expect(parsed).toEqual({ orderId: "ord_1", phone: "01012345678", orderPassword: "secret" });
  });

  it("연락처 형식이 아니면 안내한다", () => {
    const result = guestOrderLookupSchema.safeParse({
      orderId: "ord_1",
      phone: "1234",
      orderPassword: "secret",
    });
    expect(messageOf(result)).toContain("연락처 형식");
  });
});

describe("주문서 폼", () => {
  const shipping = {
    receiverName: "홍길동",
    phone: "01012345678",
    zipCode: "04524",
    address1: "서울특별시 중구 세종대로 110",
    address2: "",
    deliveryMemo: "",
    paymentOption: "tosspayments:TRANSFER",
    cashReceiptOn: false,
    cashReceiptType: "INCOME_DEDUCTION" as const,
  };
  const cashKeys = new Set(["tosspayments:TRANSFER"]);

  it("회원은 비회원 주문 정보 없이 통과한다", () => {
    const schema = checkoutFormSchema({ guest: false, cashReceiptOptionKeys: cashKeys });
    expect(schema.safeParse(shipping).success).toBe(true);
  });

  it("배송이 필요 없는 주문은 배송지 없이 통과하고, 비회원이면 연락처만 받는다", () => {
    const member = checkoutFormSchema({
      guest: false,
      cashReceiptOptionKeys: cashKeys,
      shipping: false,
    });
    expect(
      member.safeParse({
        paymentOption: "tosspayments:CARD",
        cashReceiptOn: false,
        cashReceiptType: "INCOME_DEDUCTION",
      }).success,
    ).toBe(true);
    const guest = checkoutFormSchema({
      guest: true,
      cashReceiptOptionKeys: cashKeys,
      shipping: false,
    });
    const guestInput = {
      paymentOption: "tosspayments:CARD",
      cashReceiptOn: false,
      cashReceiptType: "INCOME_DEDUCTION" as const,
      guestName: "홍길동",
      email: "guest@example.com",
      orderPassword: "123456",
    };
    expect(guest.safeParse(guestInput).success).toBe(false);
    expect(guest.safeParse({ ...guestInput, phone: "01012345678" }).success).toBe(true);
  });

  it("비회원은 주문 조회 비밀번호 6자 이상이 필요하다", () => {
    const schema = checkoutFormSchema({ guest: true, cashReceiptOptionKeys: cashKeys });
    const result = schema.safeParse({
      ...shipping,
      guestName: "홍길동",
      email: "guest@example.com",
      orderPassword: "12345",
    });
    expect(messageOf(result)).toBe("주문 조회 비밀번호는 6자 이상이어야 합니다");
  });

  it("현금영수증은 받을 수 있는 결제 옵션에서 신청했을 때만 번호를 검사한다", () => {
    const schema = checkoutFormSchema({ guest: false, cashReceiptOptionKeys: cashKeys });
    const on = { ...shipping, cashReceiptOn: true, cashReceiptNumber: "12" };
    expect(schema.safeParse(on).success).toBe(false);
    expect(schema.safeParse({ ...on, paymentOption: "tosspayments:CARD" }).success).toBe(true);
    expect(schema.safeParse({ ...on, cashReceiptNumber: "01012345678" }).success).toBe(true);
  });
});
