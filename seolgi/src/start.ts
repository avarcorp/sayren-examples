import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import { refreshBuyerSession } from "./lib/session.server";

/** 서버 함수는 같은 사이트에서 부른 것만 받는다(구매자 세션이 쿠키라서) */
const csrf = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" });

/** 구매자 세션 — 요청마다 액세스 토큰을 정하고 만료가 가까우면 갱신한다(`readToken`으로 읽는다) */
const buyerSession = createMiddleware().server(async ({ next }) => {
  const accessToken = await refreshBuyerSession();
  return next({ context: { accessToken } });
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrf, buyerSession],
}));
