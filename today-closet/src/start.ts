import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import { resolveLocale } from "./i18n";
import { runWithLocale } from "./i18n/locale.server";
import { refreshBuyerSession } from "./lib/session.server";

/**
 * 서버 함수 호출은 같은 사이트에서 온 것만 받는다. 구매자 세션이 쿠키라 다른 사이트가 결제·장바구니
 * 서버 함수를 대신 부르지 못하게 한다.
 */
const csrf = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" });

/** 구매자 세션 — 모든 요청에서 액세스 토큰을 정하고 만료가 가까우면 갱신한다(`readToken`으로 읽는다) */
const buyerSession = createMiddleware().server(async ({ next }) => {
  const accessToken = await refreshBuyerSession();
  return next({ context: { accessToken } });
});

/** 요청 언어 — `?lang=` → `Accept-Language` → ko. 화면 렌더가 끝날 때까지 유지한다(`src/i18n`) */
const locale = createMiddleware().server(({ next, request }) =>
  runWithLocale(resolveLocale(new URL(request.url), request.headers.get("accept-language")), () =>
    next(),
  ),
);

export const startInstance = createStart(() => ({
  requestMiddleware: [locale, csrf, buyerSession],
}));
