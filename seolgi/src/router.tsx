import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { RouteError } from "./components/organisms/error-view";
import { routeTree } from "./routeTree.gen";

export interface RouterContext {
  queryClient: QueryClient;
}

export function getRouter() {
  // 요청마다 새로 만든다 — 서버 렌더에서 다른 구매자의 캐시가 섞이지 않는다
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
  });
  const router = createRouter({
    routeTree,
    context: { queryClient } satisfies RouterContext,
    scrollRestoration: true,
    // 상태를 바꾸는 loader(주문서 만들기 등)는 라우트에서 preload: false로 뺀다
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
    defaultErrorComponent: RouteError,
  });
  setupRouterSsrQueryIntegration({ router, queryClient });
  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
  interface StaticDataRouteOption {
    /** 주문 단계 화면(장바구니 1·주문서 2·완료 3) — 메뉴 대신 로고와 단계 헤더, 띠·푸터 없음 */
    checkoutStep?: 1 | 2 | 3;
    /** 헤더·띠·푸터 없이 가운데 로고만 두는 화면(로그인·가입) */
    bare?: boolean;
  }
}
