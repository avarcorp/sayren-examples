import { guestInfoSchema, shippingAddressInputSchema } from "@sayren/storefront-sdk";
import { z } from "zod";

/**
 * 주문서 입력 검사 — 규칙(연락처·우편번호·비밀번호)은 SDK 스키마가 원천이고 여기서는 화면 입력 모양에 맞춘다.
 * 서버가 같은 규칙으로 다시 거절하므로 이 검사는 입력하는 동안의 안내다.
 */
const shipping = shippingAddressInputSchema.shape;

export const MEMO_PRESETS = [
  "문 앞에 놓아 주십시오",
  "경비실에 맡겨 주십시오",
  "배송 전에 연락 주십시오",
] as const;
export const MEMO_CUSTOM = "직접 입력";

export function checkoutFormSchema({ guest }: { guest: boolean }) {
  const optional = z.string().optional();
  return z.object({
    receiverName: z.string().trim().min(1, "받는 분을 입력하십시오").max(50),
    phone: z
      .string()
      .transform((v) => v.replace(/[^0-9]/g, ""))
      .pipe(shipping.phone),
    zipCode: z
      .string()
      .trim()
      .regex(/^[0-9]{5}$/, "주소 검색으로 우편번호를 입력하십시오"),
    address1: z.string().trim().min(1, "주소를 입력하십시오"),
    address2: z.string().trim().max(100),
    memoChoice: z.string(),
    memoText: z.string().trim().max(100, "요청사항은 100자까지입니다"),
    guestName: guest ? z.string().trim().min(1, "주문자 이름을 입력하십시오") : optional,
    guestEmail: guest ? z.string().trim().pipe(z.email("이메일을 다시 확인하십시오")) : optional,
    orderPassword: guest ? z.string().pipe(guestInfoSchema.shape.orderPassword) : optional,
    agree: z.literal(true, { error: "주문 내용 확인과 결제에 동의하십시오" }),
  });
}

export type CheckoutFormInput = z.input<ReturnType<typeof checkoutFormSchema>>;
export type CheckoutFormValues = z.output<ReturnType<typeof checkoutFormSchema>>;

export function memoOf(
  values: Pick<CheckoutFormValues, "memoChoice" | "memoText">,
): string | undefined {
  if (values.memoChoice === MEMO_CUSTOM) return values.memoText || undefined;
  return values.memoChoice || undefined;
}
