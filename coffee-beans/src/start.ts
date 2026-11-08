import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import { resolveLocale } from "./i18n";
import { runWithLocale } from "./i18n/locale.server";
import { resolveDevAccessToken } from "./lib/session.server";

/**
 * 서버 함수 호출은 같은 사이트에서 온 것만 받는다(장바구니·결제 서버 함수를 더해도 다른 사이트가 대신 부르지 못하게).
 */
const csrf = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" });

/** 요청 언어 — `?lang=` → `Accept-Language` → ko. 화면 렌더가 끝날 때까지 유지한다(`src/i18n`) */
const locale = createMiddleware().server(({ next, request }) =>
  runWithLocale(resolveLocale(new URL(request.url), request.headers.get("accept-language")), () =>
    next(),
  ),
);

/**
 * 구매자 세션 갱신 — 로컬 개발에서만 사이트가 토큰 쿠키를 갱신한다(호스팅은 플랫폼이 갱신한다, `lib/session.server.ts`).
 * 만료 1분 전이면 리프레시 토큰으로 바꾸고, 이 요청의 액세스 토큰을 문맥으로 넘긴다
 */
const buyerSession = createMiddleware().server(async ({ next }) => {
  const accessToken = await resolveDevAccessToken();
  return next({ context: { accessToken } });
});

export const startInstance = createStart(() => ({
  requestMiddleware: [locale, csrf, buyerSession],
}));
