import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import { resolveLocale } from "./i18n";
import { runWithLocale } from "./i18n/locale.server";

/**
 * 서버 함수 호출은 같은 사이트에서 온 것만 받는다(장바구니·결제 서버 함수를 더해도 다른 사이트가 대신 부르지 못하게).
 * 구매자 로그인을 더하면 여기에 세션 갱신 미들웨어를 더한다(sdk-buyer-auth 스킬 참고).
 */
const csrf = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" });

/** 요청 언어 — `?lang=` → `Accept-Language` → ko. 화면 렌더가 끝날 때까지 유지한다(`src/i18n`) */
const locale = createMiddleware().server(({ next, request }) =>
  runWithLocale(resolveLocale(new URL(request.url), request.headers.get("accept-language")), () =>
    next(),
  ),
);

export const startInstance = createStart(() => ({
  requestMiddleware: [locale, csrf],
}));
