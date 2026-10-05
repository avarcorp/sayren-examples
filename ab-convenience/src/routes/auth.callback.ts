import { ApiError } from "@sayren/storefront-sdk";
import { IdpCallbackError } from "@sayren/storefront-sdk/auth";
import { createFileRoute } from "@tanstack/react-router";
import queryString from "query-string";
import { authFor } from "../lib/api.server";
import { clearCartToken, readCartToken } from "../lib/cart-session.server";
import { readToken, signIn } from "../lib/session.server";
import { clearSocialLogin, readSocialLogin } from "../lib/social-login.server";

/**
 * 소셜 로그인에서 돌아오는 곳 — 쿠키에 둔 state·verifier로 1회용 code를 구매자 토큰으로 바꾸고 세션 쿠키를 심는다.
 * 비회원 장바구니가 있으면 합친다. 실패하면 로그인 화면으로 이유를 들고 돌아간다.
 *
 * 화면이 없는 서버 라우트다. 공급자가 문서째 보내 오므로 응답은 리다이렉트 하나다.
 */
export const Route = createFileRoute("/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const stored = readSocialLogin();
        clearSocialLogin();
        // 화면 밖(서버 라우트)의 주소는 query-string으로 만든다 — 값 인코딩을 손으로 하지 않는다
        const go = (path: string, query?: Record<string, string>) =>
          new Response(null, {
            status: 302,
            // 복귀 경로(`stored.redirectTo`)는 이미 완성된 주소라 그대로 쓴다
            headers: { Location: query ? queryString.stringifyUrl({ url: path, query }) : path },
          });
        const fail = (reason: string) => go("/login", { error: reason });
        if (!stored) return fail("state_mismatch");

        // 계정 연결 — 로그인한 구매자에 공급자 계정을 붙이고 계정 화면으로 돌아간다
        if (stored.linkProvider) {
          const accessToken = readToken();
          if (!accessToken) return go("/login", { redirectTo: "/account" });
          try {
            await authFor().linkIdpCallback(accessToken, stored.linkProvider, {
              code: url.searchParams.get("code"),
              state: url.searchParams.get("state"),
              error: url.searchParams.get("error"),
              expectedState: stored.state,
              codeVerifier: stored.codeVerifier,
            });
            return go("/account", { linked: stored.linkProvider });
          } catch (error) {
            if (error instanceof IdpCallbackError) return go("/account", { error: error.reason });
            if (error instanceof ApiError) return go("/account", { error: error.code });
            throw error;
          }
        }

        const cartToken = readCartToken();
        try {
          const tokens = await authFor().idpCallback({
            code: url.searchParams.get("code"),
            state: url.searchParams.get("state"),
            error: url.searchParams.get("error"),
            expectedState: stored.state,
            codeVerifier: stored.codeVerifier,
            cartToken: cartToken ?? undefined,
          });
          signIn(tokens);
          if (cartToken) clearCartToken();
          return go(stored.redirectTo);
        } catch (error) {
          if (error instanceof IdpCallbackError) return fail(error.reason);
          if (error instanceof ApiError) return fail("provider_error");
          throw error;
        }
      },
    },
  },
});
