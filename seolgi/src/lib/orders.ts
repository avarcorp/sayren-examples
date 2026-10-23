import { ApiError, type MyOrder } from "@sayren/storefront-sdk";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFor } from "./api.server";
import { clearDirectLine } from "./direct-checkout.server";
import { readToken } from "./session.server";

/** 결제수단 표시 — 간편결제는 결제사 이름 */
const METHOD: Record<string, string> = {
  CARD: "신용·체크카드",
  BANK_TRANSFER: "계좌이체",
  VIRTUAL_ACCOUNT: "가상계좌",
  MOBILE: "휴대폰 결제",
  POINT: "적립금",
};
const EASY: Record<string, string> = {
  NAVERPAY: "네이버페이",
  KAKAOPAY: "카카오페이",
  TOSSPAY: "토스페이",
  PAYCO: "페이코",
  PAYPAL: "PayPal",
};
export function paymentMethodText(payment: MyOrder["payment"]): string {
  if (payment.method === "EASY_PAY") return EASY[payment.easyPayProvider ?? ""] ?? "간편결제";
  return METHOD[payment.method] ?? String(payment.method);
}

/**
 * 주문 완료 화면의 주문 — 회원은 주문 상세를 받고, 비회원은 비밀번호가 있어야 조회되므로 주문 id만 보인다.
 * 주문이 끝났으니 바로구매 입력값(HttpOnly 쿠키)을 지운다.
 */
export const getCompletedOrderFn = createServerFn({ method: "GET" })
  .validator(z.object({ orderId: z.string().optional() }))
  .handler(async ({ data }): Promise<{ order: MyOrder | null; member: boolean }> => {
    clearDirectLine();
    const accessToken = readToken();
    if (!data.orderId || !accessToken) return { order: null, member: Boolean(accessToken) };
    const order = await apiFor({ accessToken })
      .myOrders.get(data.orderId)
      .catch(() => null);
    return { order, member: true };
  });

/** 회원 주문 하나 — 없거나 남의 주문이면 404 화면 */
export const getMyOrderFn = createServerFn({ method: "GET" })
  .validator(z.object({ orderId: z.string() }))
  .handler(async ({ data }): Promise<MyOrder> => {
    const accessToken = readToken();
    if (!accessToken) throw notFound();
    try {
      return await apiFor({ accessToken }).myOrders.get(data.orderId);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 403))
        throw notFound();
      throw error;
    }
  });

/** 연락처 — 숫자만, 해외 번호(E.164)는 맨 앞 `+`를 남긴다(주문할 때 적은 형식 그대로 조회한다) */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  return phone.trim().startsWith("+") ? `+${digits}` : digits;
}

/**
 * 비회원 주문 조회 — 주문번호(또는 주문 id)·연락처·주문 조회 비밀번호. 틀린 것과 없는 것을 구분하지 않는다.
 * 주문번호마다 시도 한도가 있어 넘으면 남은 시간을 안내한다.
 */
export const lookupGuestOrderFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderRef: z.string().trim().min(1).max(64),
      phone: z.string().max(20),
      orderPassword: z.string().max(128),
    }),
  )
  .handler(async ({ data }): Promise<{ order: MyOrder | null; error: string | null }> => {
    try {
      const order = await apiFor().myOrders.getGuestOrder(data.orderRef.replace(/\s/g, ""), {
        phone: normalizePhone(data.phone),
        orderPassword: data.orderPassword,
      });
      return { order, error: null };
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        const seconds = Number(error.details?.retryAfterSeconds);
        return {
          order: null,
          error:
            seconds > 0
              ? `확인을 여러 번 실패했습니다. ${Math.ceil(seconds / 60)}분 뒤 다시 시도하십시오.`
              : "잠시 뒤 다시 시도하십시오.",
        };
      }
      return {
        order: null,
        error: "주문 정보가 맞지 않습니다. 주문번호·연락처·비밀번호를 다시 확인하십시오.",
      };
    }
  });
