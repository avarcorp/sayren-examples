import type { StorefrontCoupon } from "@sayren/storefront-sdk";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFor } from "./api.server";
import { messageOf } from "./errors";
import { formatMoney } from "./format";
import { readToken } from "./session.server";

/** 쿠폰 혜택 글 — 정률은 「10% (최대 5,000원)」, 정액은 「3,000원」. 금액 계산은 하지 않는다 */
export function benefitText(benefit: StorefrontCoupon["benefit"]): string {
  if (benefit.type === "RATE") {
    return `${benefit.value}%${benefit.maxDiscountAmount ? ` (최대 ${formatMoney(benefit.maxDiscountAmount)})` : ""}`;
  }
  return formatMoney(benefit.value);
}

/** 쿠폰 받기 — 회원 전용. 실패는 서버 문구로 돌려준다 */
export const downloadCouponFn = createServerFn({ method: "POST" })
  .validator(z.object({ couponId: z.string() }))
  .handler(async ({ data }): Promise<{ ok: true } | { needLogin: true } | { error: string }> => {
    const accessToken = readToken();
    if (!accessToken) return { needLogin: true };
    try {
      await apiFor({ accessToken }).me.downloadCoupon(data.couponId);
      return { ok: true };
    } catch (error) {
      return { error: messageOf(error, "쿠폰을 받지 못했습니다.") };
    }
  });
