import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFor } from "./api.server";
import { readToken } from "./session.server";

/** 찜 켜고 끄기 — 회원만. 로그인하지 않았으면 `needLogin`을 돌려 화면이 로그인으로 보낸다 */
export const toggleWishFn = createServerFn({ method: "POST" })
  .validator(z.object({ productId: z.string(), wished: z.boolean() }))
  .handler(async ({ data }): Promise<{ wished: boolean } | { needLogin: true }> => {
    const accessToken = readToken();
    if (!accessToken) return { needLogin: true };
    const api = apiFor({ accessToken });
    if (data.wished) await api.member.addWishlist(data.productId);
    else await api.member.removeWishlist(data.productId);
    return { wished: data.wished };
  });
