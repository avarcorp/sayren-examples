import { claimReasonSchema, type MyOrder } from "@sayren/storefront-sdk";
import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";
import { failureOf } from "./api-errors";
import {
  authFor,
  buyerApi,
  readCartToken,
  readToken,
  signIn,
  signOutCookies,
} from "./session.server";
import type { ActionResult } from "./shop-actions";

/**
 * 구매자 행동(서버 함수) — 장바구니 수정, 로그인·가입·로그아웃·탈퇴, 회원 정보·배송지·동의, 주문 행동·클레임,
 * 1:1 문의, 비회원 주문 조회. 결과는 `ActionResult`이고 화면은 실패 message를 그대로 보인다.
 */

async function attempt<T extends object = object>(
  // biome-ignore lint/suspicious/noConfusingVoidType: 반환값이 없는 행동도 같은 래퍼로 받는다
  run: () => Promise<T | undefined | void>,
): Promise<ActionResult<T>> {
  try {
    const value = await run();
    return { ok: true, ...(value ?? ({} as T)) };
  } catch (error) {
    return failureOf(error);
  }
}

export const updateCartItem = createServerFn({ method: "POST" })
  .validator(
    z.object({ cartItemId: z.string().min(1), quantity: z.number().int().min(1).max(999) }),
  )
  .handler(({ data }) =>
    attempt(async () => {
      await buyerApi().cart.updateItem(data.cartItemId, { quantity: data.quantity });
    }),
  );

export const removeCartItem = createServerFn({ method: "POST" })
  .validator(z.object({ cartItemId: z.string().min(1) }))
  .handler(({ data }) =>
    attempt(async () => {
      await buyerApi().cart.removeItem(data.cartItemId);
    }),
  );

/** 장바구니에서 주문서 만들기 — 구매 가능한 항목만 */
export const checkoutFromCart = createServerFn({ method: "POST" })
  .validator(z.object({ cartItemIds: z.array(z.string().min(1)).min(1) }))
  .handler(({ data }) =>
    attempt(async () => {
      const checkout = await buyerApi().checkout.create({ cartItemIds: data.cartItemIds });
      return { checkoutId: checkout.checkoutId };
    }),
  );

export const login = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.email(), password: z.string().min(1) }))
  .handler(({ data }) =>
    attempt(async () => {
      const tokens = await authFor().session({
        ...data,
        cartToken: readCartToken() ?? undefined,
      });
      signIn(tokens);
    }),
  );

export const signup = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.email(),
      password: z.string().min(8),
      name: z.string().min(1),
      phone: z.string().min(1),
      marketing: z.boolean(),
    }),
  )
  .handler(({ data }) =>
    attempt(async () => {
      const tokens = await authFor().signUp({
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone,
        agreements: { terms: true, privacy: true, marketing: data.marketing },
        cartToken: readCartToken() ?? undefined,
      });
      signIn(tokens);
    }),
  );

/** 비밀번호 재설정 메일 — 바꾼 뒤 이 사이트의 로그인 화면으로 돌아온다 */
export const requestPasswordReset = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.email() }))
  .handler(({ data }) =>
    attempt(async () => {
      const successUrl = new URL("/login", new URL(getRequestUrl()).origin).toString();
      await authFor().requestPasswordReset({ email: data.email, successUrl });
    }),
  );

export const logout = createServerFn({ method: "POST" }).handler(
  async (): Promise<ActionResult> => {
    const accessToken = readToken();
    if (accessToken)
      await authFor()
        .signOut(accessToken)
        .catch(() => undefined);
    signOutCookies();
    return { ok: true };
  },
);

export const withdrawMember = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().optional() }))
  .handler(({ data }) =>
    attempt(async () => {
      const accessToken = readToken();
      if (!accessToken) throw new Error("not signed in");
      await authFor().withdraw(accessToken, { password: data.password || undefined });
      signOutCookies();
    }),
  );

export const updateProfile = createServerFn({ method: "POST" })
  .validator(
    z.object({ name: z.string().min(1), phone: z.string().min(1), marketingAgreed: z.boolean() }),
  )
  .handler(({ data }) =>
    attempt(async () => {
      await buyerApi().member.updateMe(data);
    }),
  );

/** 개정 약관 재동의 */
export const agreeToCurrentTerms = createServerFn({ method: "POST" }).handler(() =>
  attempt(async () => {
    await buyerApi().member.updateConsents({ terms: true, privacy: true });
  }),
);

export const deleteAddress = createServerFn({ method: "POST" })
  .validator(z.object({ addressId: z.string().min(1) }))
  .handler(({ data }) =>
    attempt(async () => {
      await buyerApi().member.deleteAddress(data.addressId);
    }),
  );

export const runOrderAction = createServerFn({ method: "POST" })
  .validator(z.object({ orderItemId: z.string().min(1), key: z.string().min(1) }))
  .handler(({ data }) =>
    attempt(async () => {
      await buyerApi().myOrders.act(data.orderItemId, data.key);
    }),
  );

const claimSchema = z.object({
  orderItemId: z.string().min(1),
  type: z.enum(["CANCEL", "RETURN", "EXCHANGE"]),
  reason: claimReasonSchema,
  detail: z.string().max(500).optional(),
});

const claimBody = (data: z.infer<typeof claimSchema>) => ({
  type: data.type,
  reason: data.reason,
  reasonDetail: data.detail,
});

/** 클레임 미리보기 — 환불 예정 금액(서버 계산)을 보인다 */
export const previewClaim = createServerFn({ method: "POST" })
  .validator(claimSchema)
  .handler(({ data }) =>
    attempt(async () => {
      const preview = await buyerApi().myClaims.preview(data.orderItemId, claimBody(data));
      return { refundAmount: preview.expectedRefundAmount as number | null };
    }),
  );

export const createClaim = createServerFn({ method: "POST" })
  .validator(claimSchema)
  .handler(({ data }) =>
    attempt(async () => {
      await buyerApi().myClaims.create(data.orderItemId, claimBody(data));
    }),
  );

export const createSupportInquiry = createServerFn({ method: "POST" })
  .validator(z.object({ title: z.string().min(1).max(100), content: z.string().min(1).max(2000) }))
  .handler(({ data }) =>
    attempt(async () => {
      await buyerApi().me.customerInquiries.create({ category: "ETC", ...data });
    }),
  );

/** 비회원 주문 조회 — 주문 비밀번호는 POST 본문으로만 받는다. 401·404는 같은 안내 하나로 */
export const lookupGuestOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderNo: z.string().min(1),
      phone: z.string().min(1),
      orderPassword: z.string().min(1),
    }),
  )
  .handler(({ data }) =>
    attempt<{ order: MyOrder }>(async () => {
      const order = await buyerApi().myOrders.getGuestOrder(data.orderNo.replace(/\D/g, ""), {
        phone: data.phone.replace(/\D/g, ""),
        orderPassword: data.orderPassword,
      });
      return { order };
    }),
  );

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  content: z.string().min(10).max(2000),
});

export const createReview = createServerFn({ method: "POST" })
  .validator(reviewSchema.extend({ orderItemId: z.string().min(1) }))
  .handler(({ data }) =>
    attempt(async () => {
      const result = await buyerApi().reviews.create(data.orderItemId, {
        rating: data.rating,
        content: data.content,
      });
      return { rewardPoint: result.rewardPoint ?? 0 };
    }),
  );

export const updateReview = createServerFn({ method: "POST" })
  .validator(reviewSchema.extend({ reviewId: z.string().min(1) }))
  .handler(({ data }) =>
    attempt(async () => {
      await buyerApi().reviews.update(data.reviewId, {
        rating: data.rating,
        content: data.content,
      });
    }),
  );

export const removeReview = createServerFn({ method: "POST" })
  .validator(z.object({ reviewId: z.string().min(1) }))
  .handler(({ data }) =>
    attempt(async () => {
      await buyerApi().reviews.remove(data.reviewId);
    }),
  );
