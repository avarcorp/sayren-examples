import {
  cashReceiptRequestSchema,
  cashReceiptTypeSchema,
  guestInfoSchema,
  shippingAddressInputSchema,
  signupRequestSchema,
} from "@sayren/storefront-sdk";
import { z } from "zod";
import { m } from "../i18n";

/**
 * 폼 스키마 — react-hook-form의 `zodResolver`에 넣는다.
 *
 * 입력 규칙(비밀번호 조합·휴대폰·우편번호·현금영수증 번호)은 SDK 스키마가 원천이다. 여기서는 화면 입력 모양
 * (빈 칸은 `""`, 동의는 체크박스)에 맞추고 안내 문구를 붙이기만 한다. 서버 함수는 보내기 전에 SDK 스키마로
 * 다시 확인하고 서버도 같은 규칙으로 거절하므로, 이 검사는 입력하는 동안의 안내다.
 */

/** SDK 규칙을 그대로 쓰되 안내 문구만 바꾼다(SDK 스키마 일부는 문구가 없다) */
const matches = (schema: z.ZodType, message: () => string) =>
  z.string().refine((value) => schema.safeParse(value).success, { error: message });

// ── 회원가입 ─────────────────────────────────────────────────────────────

const signupPhone = signupRequestSchema.shape.phone.unwrap();

export const signupFormSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: () => m.form_schemas_email_invalid() })),
  password: signupRequestSchema.shape.password,
  name: z
    .string()
    .trim()
    .min(1, { error: () => m.form_schemas_name_required() })
    .max(50, { error: () => m.form_schemas_name_too_long() }),
  /** 선택 입력 — 비우면 보내지 않는다 */
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || signupPhone.safeParse(value).success, {
      error: () => m.form_schemas_phone_invalid(),
    }),
  // 체크박스는 체크 전 false다 — 입력은 boolean으로 받고 필수 동의만 true를 요구한다
  agreements: z.object({
    terms: z.boolean().refine((agreed) => agreed, { error: () => m.form_schemas_terms_required() }),
    privacy: z
      .boolean()
      .refine((agreed) => agreed, { error: () => m.form_schemas_terms_required() }),
    marketing: z.boolean(),
  }),
});

export type SignupFormInput = z.input<typeof signupFormSchema>;
export type SignupForm = z.output<typeof signupFormSchema>;

// ── 비회원 주문 조회 ──────────────────────────────────────────────────────

export const guestOrderLookupSchema = z.object({
  orderId: z
    .string()
    .trim()
    .min(1, { error: () => m.form_schemas_order_id_required() }),
  // 하이픈·공백을 넣어도 숫자만 읽는다
  phone: z
    .string()
    .transform((value) => value.replace(/[^0-9]/g, ""))
    .pipe(matches(guestInfoSchema.shape.phone, () => m.form_schemas_contact_invalid())),
  orderPassword: z.string().min(1, { error: () => m.form_schemas_order_password_required() }),
});

export type GuestOrderLookupInput = z.input<typeof guestOrderLookupSchema>;
export type GuestOrderLookup = z.output<typeof guestOrderLookupSchema>;

// ── 주문서 ───────────────────────────────────────────────────────────────

/**
 * 주문서 폼. 비회원 주문 정보는 비회원일 때만 받고, 현금영수증은 계좌이체·가상계좌 옵션을 골랐고 신청을 켰을 때만
 * 검사한다(`cashReceiptOptionKeys`는 그런 결제 옵션의 키).
 *
 * 배송지는 주문서의 `requiresShipping`이 true일 때만 받는다(`shipping`, 생략하면 true). 배송이 필요 없는 주문(배송 없는
 * 상품만 담은 주문)은 배송지 칸이 없고, 연락처는 비회원 주문자 연락처로만 받는다.
 */
export function checkoutFormSchema(options: {
  guest: boolean;
  cashReceiptOptionKeys: ReadonlySet<string>;
  shipping?: boolean;
}) {
  const shipping = shippingAddressInputSchema.shape;
  const address = options.shipping ?? true;
  const optional = z.string().optional();
  return z
    .object({
      receiverName: address ? z.string().trim().pipe(shipping.receiverName) : optional,
      phone:
        address || options.guest ? z.string().trim().pipe(shipping.phone) : z.string().optional(),
      zipCode: address ? z.string().trim().pipe(shipping.zipCode) : optional,
      address1: address ? z.string().trim().pipe(shipping.address1) : optional,
      address2: address ? z.string().trim() : optional,
      deliveryMemo: address
        ? z
            .string()
            .trim()
            .max(100, { error: () => m.form_schemas_delivery_memo_too_long() })
        : optional,
      guestName: options.guest
        ? z
            .string()
            .trim()
            .min(1, { error: () => m.form_schemas_guest_name_required() })
        : z.string().optional(),
      email: options.guest
        ? z
            .string()
            .trim()
            .pipe(z.email({ error: () => m.form_schemas_email_invalid() }))
        : z.string().optional(),
      orderPassword: options.guest ? guestInfoSchema.shape.orderPassword : z.string().optional(),
      paymentOption: z.string().min(1, { error: () => m.form_schemas_payment_option_required() }),
      cashReceiptOn: z.boolean(),
      cashReceiptType: cashReceiptTypeSchema,
      cashReceiptNumber: z.string().optional(),
    })
    .superRefine((value, ctx) => {
      if (!value.cashReceiptOn || !options.cashReceiptOptionKeys.has(value.paymentOption)) return;
      const parsed = cashReceiptRequestSchema.safeParse({
        type: value.cashReceiptType,
        identityNumber: value.cashReceiptNumber ?? "",
      });
      if (!parsed.success) {
        ctx.addIssue({
          code: "custom",
          path: ["cashReceiptNumber"],
          message: parsed.error.issues[0]?.message ?? m.form_schemas_cash_receipt_invalid(),
        });
      }
    });
}

export type CheckoutFormSchema = ReturnType<typeof checkoutFormSchema>;
export type CheckoutFormInput = z.input<CheckoutFormSchema>;
export type CheckoutForm = z.output<CheckoutFormSchema>;
