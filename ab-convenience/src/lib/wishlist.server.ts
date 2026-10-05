import { apiFor } from "./api.server";

/**
 * 상세의 찜 여부 — 찜 여부를 묻는 단건 API가 없어 내 찜 목록 앞부분에서 찾는다(상점 상품 수가 작아 100개면 충분하다).
 * 서버 함수 안에서만 부른다(구매자 토큰은 서버에만 있다).
 */
const WISHLIST_SCAN = 100;

export async function wishedOf(accessToken: string | null, productId: string): Promise<boolean> {
  if (!accessToken) return false;
  const page = await apiFor({ accessToken })
    .member.listWishlist({ size: WISHLIST_SCAN })
    .catch(() => null);
  return Boolean(page?.contents.some((item) => item.productId === productId));
}
