import { IdpCallbackError } from "@sayren/storefront-sdk/auth";
import { createFileRoute } from "@tanstack/react-router";
import { authFor } from "../lib/api.server";
import { clearCartToken, readCartToken } from "../lib/cart-session.server";
import { signIn } from "../lib/session.server";
import { clearSocialLogin, readSocialLogin } from "../lib/social-login.server";

/**
 * 소셜 로그인에서 돌아오는 곳 — 쿠키의 state·verifier로 1회용 code를 구매자 토큰으로 바꾸고 세션 쿠키를 심는다.
 * 비회원 장바구니가 있으면 합친다. 실패하면 로그인 화면으로 이유를 들고 돌아간다. 화면 없는 서버 라우트다.
 */
export const Route = createFileRoute("/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const stored = readSocialLogin();
        clearSocialLogin();
        const go = (path: string, query?: Record<string, string>) => {
          const target = new URL(path, url.origin);
          for (const [k, v] of Object.entries(query ?? {})) target.searchParams.set(k, v);
          return new Response(null, {
            status: 302,
            headers: { Location: target.pathname + target.search },
          });
        };
        if (!stored) return go("/login", { error: "state_mismatch" });
        const cartToken = readCartToken();
        try {
          signIn(
            await authFor().idpCallback({
              code: url.searchParams.get("code"),
              state: url.searchParams.get("state"),
              error: url.searchParams.get("error"),
              expectedState: stored.state,
              codeVerifier: stored.codeVerifier,
              cartToken: cartToken ?? undefined,
            }),
          );
          if (cartToken) clearCartToken();
          return go(stored.redirectTo);
        } catch (error) {
          // 공급자 거절·state 불일치는 이유를, 그 밖(API 오류·네트워크)은 일반 실패로 로그인 화면에 알린다
          if (error instanceof IdpCallbackError) return go("/login", { error: error.reason });
          return go("/login", { error: "provider_error" });
        }
      },
    },
  },
});
