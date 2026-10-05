import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFor } from "./api.server";
import { readToken } from "./session.server";

export const MY_COUPON_STATUSES = ["available", "used", "expired"] as const;
export type MyCouponStatus = (typeof MY_COUPON_STATUSES)[number];

/**
 * 내 보유 쿠폰 — 회원만 있다. 비회원이면 `loggedIn: false`로 빈 목록이다. `status`로 사용 가능·사용 완료·기간 만료를 거른다
 * (기본은 지금 쓸 수 있는 것). 혜택·조건은 서버 응답 그대로 보인다(화면이 할인액을 계산하지 않는다).
 */
export const getMyCoupons = createServerFn({ method: "GET" })
  .validator(z.object({ status: z.enum(MY_COUPON_STATUSES) }).optional())
  .handler(async ({ data }) => {
    const accessToken = readToken();
    if (!accessToken) return { loggedIn: false, coupons: [] };
    const coupons = await apiFor({ accessToken })
      .me.coupons({ status: data?.status ?? "available" })
      .catch(() => []);
    return { loggedIn: true, coupons };
  });
