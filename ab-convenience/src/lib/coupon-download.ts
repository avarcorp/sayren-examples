import { ApiError, type StorefrontCoupon } from "@sayren/storefront-sdk";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { m } from "../i18n";
import { apiFor } from "./api.server";
import { readToken } from "./session.server";

/**
 * 받을 수 있는 쿠폰(다운로드 쿠폰, #110) — 누구나 목록을 본다. 회원이면 항목마다 받음 여부(`downloaded`·`downloadable`)가 실린다.
 * `productId`를 주면 그 상품에 쓸 수 있는 쿠폰만이다. 실패하면 빈 목록이다(쿠폰 영역만 숨는다).
 */
export const getDownloadableCoupons = createServerFn({ method: "GET" })
  .validator(z.object({ productId: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const accessToken = readToken();
    const page = await apiFor({ accessToken })
      .catalog.listCoupons({ productId: data?.productId, size: 50 })
      .catch(() => null);
    return {
      loggedIn: Boolean(accessToken),
      coupons: page?.contents ?? ([] as StorefrontCoupon[]),
    };
  });

/** 쿠폰 받기 — 회원 토큰은 서버에서만 싣는다. 결과는 성공 여부와 구매자에게 보일 문구다 */
export const downloadCoupon = createServerFn({ method: "POST" })
  .validator(z.object({ couponId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const accessToken = readToken();
    if (!accessToken) return { ok: false, loginRequired: true, error: m.coupon_download_login() };
    try {
      await apiFor({ accessToken }).me.downloadCoupon(data.couponId);
      return { ok: true, loginRequired: false, error: null };
    } catch (error) {
      return {
        ok: false,
        loginRequired: error instanceof ApiError && error.status === 401,
        error: downloadErrorMessage(error instanceof ApiError ? error.code : null),
      };
    }
  });

export function downloadErrorMessage(code: string | null): string {
  switch (code) {
    case "COUPON_ALREADY_DOWNLOADED":
      return m.coupon_download_already();
    case "COUPON_SOLD_OUT":
      return m.coupon_download_sold_out();
    case "COUPON_NOT_STARTED":
      return m.coupon_download_not_started();
    case "COUPON_EXPIRED":
    case "COUPON_NOT_FOUND":
      return m.coupon_download_ended();
    case "UNAUTHORIZED":
      return m.coupon_download_login();
    default:
      return m.coupon_download_failed();
  }
}
