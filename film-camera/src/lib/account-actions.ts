import {
  claimReasonSchema,
  customerInquiryCategorySchema,
  memberAddressRequestSchema,
} from "@sayren/storefront-sdk";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFor } from "./api.server";
import { buyerApi } from "./buyer.server";
import { attempt } from "./result";

/** 마이페이지 쓰기 — 회원 정보·배송지·리뷰·주문 행동·반품/교환·1:1 문의·비회원 주문 조회 */

export const updateProfile = createServerFn({ method: "POST" })
  .validator(
    z.object({ name: z.string().min(1).max(50), phone: z.string(), marketingAgreed: z.boolean() }),
  )
  .handler(({ data }) =>
    attempt(() =>
      buyerApi().member.updateMe({
        name: data.name,
        phone: data.phone || undefined,
        marketingAgreed: data.marketingAgreed,
      }),
    ),
  );

export const createAddress = createServerFn({ method: "POST" })
  .validator(memberAddressRequestSchema)
  .handler(({ data }) => attempt(() => buyerApi().member.createAddress(data)));

export const updateAddress = createServerFn({ method: "POST" })
  .validator(z.object({ addressId: z.string().min(1), body: memberAddressRequestSchema }))
  .handler(({ data }) => attempt(() => buyerApi().member.updateAddress(data.addressId, data.body)));

export const deleteAddress = createServerFn({ method: "POST" })
  .validator(z.object({ addressId: z.string().min(1) }))
  .handler(({ data }) => attempt(() => buyerApi().member.deleteAddress(data.addressId)));

export const createReview = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderItemId: z.string().min(1),
      rating: z.number().int().min(1).max(5),
      content: z.string().min(10).max(2000),
    }),
  )
  .handler(({ data }) =>
    attempt(() =>
      buyerApi().reviews.create(data.orderItemId, { rating: data.rating, content: data.content }),
    ),
  );

export const removeReview = createServerFn({ method: "POST" })
  .validator(z.object({ reviewId: z.string().min(1) }))
  .handler(({ data }) => attempt(() => buyerApi().reviews.remove(data.reviewId)));

/** 주문 흐름이 준 행동(`items[].actions`)을 실행한다 */
export const actOnOrderItem = createServerFn({ method: "POST" })
  .validator(z.object({ orderItemId: z.string().min(1), key: z.string().min(1) }))
  .handler(({ data }) => attempt(() => buyerApi().myOrders.act(data.orderItemId, data.key)));

export const createClaim = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderItemId: z.string().min(1),
      type: z.enum(["CANCEL", "RETURN", "EXCHANGE"]),
      reason: claimReasonSchema,
      reasonDetail: z.string().max(1000).optional(),
    }),
  )
  .handler(({ data }) =>
    attempt(() =>
      buyerApi().myClaims.create(data.orderItemId, {
        type: data.type,
        reason: data.reason,
        reasonDetail: data.reasonDetail || undefined,
      }),
    ),
  );

export const withdrawClaim = createServerFn({ method: "POST" })
  .validator(z.object({ claimId: z.string().min(1) }))
  .handler(({ data }) => attempt(() => buyerApi().myClaims.withdraw(data.claimId)));

export const createSupportInquiry = createServerFn({ method: "POST" })
  .validator(
    z.object({
      category: customerInquiryCategorySchema,
      title: z.string().min(1).max(100),
      content: z.string().min(1).max(2000),
      orderItemId: z.string().optional(),
    }),
  )
  .handler(({ data }) =>
    attempt(() =>
      buyerApi().me.customerInquiries.create({
        category: data.category,
        title: data.title,
        content: data.content,
        orderItemId: data.orderItemId || undefined,
      }),
    ),
  );

/** 비회원 주문 조회 — 폼 본문(POST)으로 받아 서버에서 부른다. 비밀번호가 URL에 남지 않는다 */
export const lookupGuestOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderNo: z.string().min(1),
      phone: z.string().min(1),
      orderPassword: z.string().min(1),
    }),
  )
  .handler(({ data }) =>
    attempt(() =>
      apiFor().myOrders.getGuestOrder(data.orderNo.replace(/\D/g, "") || data.orderNo, {
        phone: data.phone.replace(/\D/g, ""),
        orderPassword: data.orderPassword,
      }),
    ),
  );
