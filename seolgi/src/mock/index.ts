import { accountRoutes } from "./account-routes";
import { authRoutes } from "./auth-routes";
import { cartRoutes } from "./cart-routes";
import { catalogRoutes } from "./catalog-routes";
import { checkoutRoutes } from "./checkout-routes";
import { createMockFetch } from "./http";
import { memberRoutes } from "./member-routes";

/**
 * mock 모드(`SAYREN_MOCK=1`)의 fetch — SDK 클라이언트에 끼우면 운영 API 대신 고정 데이터로 응답한다.
 * 서버(서버 함수)에서만 부른다. 상태는 dev 서버 메모리에만 있다.
 */
export function mockFetch(origin: string): typeof fetch {
  return createMockFetch(
    [
      ...catalogRoutes,
      ...cartRoutes,
      ...authRoutes,
      ...memberRoutes,
      ...checkoutRoutes,
      ...accountRoutes,
    ],
    origin,
  );
}
