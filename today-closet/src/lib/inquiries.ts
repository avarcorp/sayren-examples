import {
  ApiError,
  createCustomerInquiryRequestSchema,
  createInquiryRequestSchema,
  formatOrderNo,
} from "@sayren/storefront-sdk";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFor } from "./api.server";
import { requireToken } from "./require-token.server";
import { readToken } from "./session.server";

/**
 * 상품 문의·1:1 문의 서버 함수 — 구매자 토큰은 서버에만 두므로 읽기·쓰기 모두 여기서 한다.
 * 화면은 결과만 받는다. 로그인이 필요한 화면은 토큰이 없으면 로그인으로 보낸다.
 */

const MY_PAGE_SIZE = 10;

/** 상품 문의 등록 — 실패해도 화면은 오류 문구만 보인다. 로그인이 풀렸으면 `loginRequired` */
export const createProductInquiry = createServerFn({ method: "POST" })
  .validator(z.object({ productId: z.string(), body: createInquiryRequestSchema }))
  .handler(async ({ data }): Promise<{ ok: boolean; loginRequired: boolean }> => {
    const accessToken = readToken();
    if (!accessToken) return { ok: false, loginRequired: true };
    try {
      await apiFor({ accessToken }).catalog.createInquiry(data.productId, data.body);
      return { ok: true, loginRequired: false };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return { ok: false, loginRequired: true };
      }
      return { ok: false, loginRequired: false };
    }
  });

/** 내 상품 문의 — `answered`로 답변 완료·대기를 거른다 */
export const listMyProductInquiries = createServerFn({ method: "GET" })
  .validator(z.object({ page: z.number().int().min(1), answered: z.boolean().optional() }))
  .handler(async ({ data }) => {
    const accessToken = requireToken("/account/inquiries");
    return apiFor({ accessToken }).inquiries.listMine({
      page: data.page,
      size: MY_PAGE_SIZE,
      answered: data.answered,
    });
  });

export const listMySupportInquiries = createServerFn({ method: "GET" })
  .validator(z.object({ page: z.number().int().min(1) }))
  .handler(async ({ data }) => {
    const accessToken = requireToken("/account/support");
    return apiFor({ accessToken }).me.customerInquiries.list({
      page: data.page,
      size: MY_PAGE_SIZE,
    });
  });

export const getMySupportInquiry = createServerFn({ method: "GET" })
  .validator(z.object({ inquiryId: z.string() }))
  .handler(async ({ data }) => {
    const accessToken = requireToken(`/account/support/${data.inquiryId}`);
    try {
      return await apiFor({ accessToken }).me.customerInquiries.get(data.inquiryId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) throw notFound();
      throw error;
    }
  });

/** 1:1 문의 작성 화면 — 관련 주문 상품을 고를 수 있게 최근 주문 상품 이름을 함께 준다 */
export const getSupportFormData = createServerFn({ method: "GET" }).handler(async () => {
  const accessToken = requireToken("/account/support/new");
  const orders = await apiFor({ accessToken })
    .myOrders.list({ size: 10 })
    .catch(() => null);
  return {
    orderItems: (orders?.contents ?? []).flatMap((order) =>
      order.items.map((item) => ({
        orderItemId: item.orderItemId,
        label: `${order.orderNo ? formatOrderNo(order.orderNo) : order.orderId} · ${item.productName}${item.optionName ? ` (${item.optionName})` : ""}`,
      })),
    ),
  };
});

export const createSupportInquiry = createServerFn({ method: "POST" })
  .validator(createCustomerInquiryRequestSchema)
  .handler(async ({ data }): Promise<{ inquiryId: string | null; error: boolean }> => {
    const accessToken = requireToken("/account/support/new");
    try {
      const created = await apiFor({ accessToken }).me.customerInquiries.create(data);
      return { inquiryId: created.inquiryId, error: false };
    } catch {
      return { inquiryId: null, error: true };
    }
  });
