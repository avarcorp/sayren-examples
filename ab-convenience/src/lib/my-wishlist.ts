import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFor } from "./api.server";
import { requireToken } from "./require-token.server";

export const MY_WISHLIST_PAGE_SIZE = 20;

/**
 * 찜한 상품 — 회원만 있다(`/me/wishlist`). 로그인하지 않았으면 로그인으로 보낸다. 찜 해제는 `toggleWish`(`lib/wishlist.ts`)다.
 * 항목은 상품 카드와 같은 모양이라 `ProductCard`로 그린다.
 */
export const getMyWishlist = createServerFn({ method: "GET" })
  .validator(z.object({ page: z.number().int().min(1) }))
  .handler(async ({ data }) => {
    const accessToken = requireToken("/account/wishlist");
    return apiFor({ accessToken }).member.listWishlist({
      page: data.page,
      size: MY_WISHLIST_PAGE_SIZE,
    });
  });
