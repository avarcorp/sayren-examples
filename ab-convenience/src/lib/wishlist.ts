import { ApiError } from "@sayren/storefront-sdk";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFor } from "./api.server";
import { readToken } from "./session.server";

/**
 * 찜 — 회원만 쓴다(`/me/wishlist`). 구매자 토큰은 서버에만 두므로 서버 함수로 한다.
 */
export const toggleWish = createServerFn({ method: "POST" })
  .validator(z.object({ productId: z.string(), wish: z.boolean() }))
  .handler(async ({ data }): Promise<{ wished: boolean | null; loginRequired: boolean }> => {
    const accessToken = readToken();
    if (!accessToken) return { wished: null, loginRequired: true };
    const member = apiFor({ accessToken }).member;
    try {
      if (data.wish) await member.addWishlist(data.productId);
      else await member.removeWishlist(data.productId);
      return { wished: data.wish, loginRequired: false };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return { wished: null, loginRequired: true };
      }
      return { wished: null, loginRequired: false };
    }
  });
