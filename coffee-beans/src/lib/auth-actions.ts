import { IdpCallbackError } from "@sayren/storefront-sdk/auth";
import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";
import { buyerApi } from "./buyer.server";
import { clearServerCookie, readServerCookie, writeServerCookie } from "./cookies.server";
import { attempt } from "./result";
import {
  authFor,
  clearCartToken,
  readAccessToken,
  readCartToken,
  signIn,
  signOut,
} from "./session.server";

/**
 * 구매자 인증 쓰기 — 로그인·가입·소셜 로그인·로그아웃·탈퇴·재동의·비밀번호 재설정.
 * 로그인·가입에 비회원 장바구니 토큰을 넣어 회원 장바구니로 합치고, 합친 뒤 장바구니 쿠키를 지운다.
 */

const SOCIAL = "wsg_idp";
const SOCIAL_MAX_AGE = 60 * 10;
const CALLBACK_PATH = "/auth/callback";

/** 로그인 뒤 돌아갈 주소 — 같은 사이트 안의 경로만 받는다 */
function safeRedirect(path: string | undefined): string {
  return path?.startsWith("/") && !path.startsWith("//") ? path : "/";
}

export const login = createServerFn({ method: "POST" })
  .validator(
    z.object({ email: z.email(), password: z.string().min(1), redirect: z.string().optional() }),
  )
  .handler(({ data }) =>
    attempt(async () => {
      const tokens = await authFor().session({
        email: data.email,
        password: data.password,
        cartToken: readCartToken() ?? undefined,
      });
      signIn(tokens);
      clearCartToken();
      return { redirect: safeRedirect(data.redirect) };
    }),
  );

export const signup = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(1).max(50),
      email: z.email(),
      password: z.string().min(8),
      marketing: z.boolean(),
      redirect: z.string().optional(),
    }),
  )
  .handler(({ data }) =>
    attempt(async () => {
      const tokens = await authFor().signUp({
        email: data.email,
        password: data.password,
        name: data.name,
        agreements: { terms: true, privacy: true, marketing: data.marketing },
        cartToken: readCartToken() ?? undefined,
      });
      signIn(tokens);
      clearCartToken();
      return { redirect: safeRedirect(data.redirect) };
    }),
  );

export const requestPasswordReset = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.email() }))
  .handler(({ data }) =>
    attempt(async () => {
      const successUrl = new URL("/login", new URL(getRequestUrl()).origin);
      await authFor().requestPasswordReset({
        email: data.email,
        successUrl: successUrl.protocol === "https:" ? successUrl.toString() : undefined,
      });
      return null;
    }),
  );

/** 소셜 로그인 시작 — state·codeVerifier를 짧게 사는 HttpOnly 쿠키에 두고 공급자 주소를 돌려준다 */
export const startSocialLogin = createServerFn({ method: "POST" })
  .validator(
    z.object({ provider: z.enum(["kakao", "naver", "google"]), redirect: z.string().optional() }),
  )
  .handler(({ data }) =>
    attempt(async () => {
      const redirectUri = new URL(CALLBACK_PATH, new URL(getRequestUrl()).origin).toString();
      const started = await authFor().idp(data.provider, { redirectUri });
      writeServerCookie(
        SOCIAL,
        JSON.stringify({
          state: started.state,
          codeVerifier: started.codeVerifier,
          redirect: safeRedirect(data.redirect),
        }),
        SOCIAL_MAX_AGE,
      );
      return { url: started.url };
    }),
  );

/** 소셜 로그인 마무리 — 복귀 화면이 부른다 */
export const finishSocialLogin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      code: z.string().nullable(),
      state: z.string().nullable(),
      error: z.string().nullable(),
    }),
  )
  .handler(async ({ data }): Promise<{ ok: true; redirect: string } | { ok: false }> => {
    const raw = readServerCookie(SOCIAL);
    clearServerCookie(SOCIAL);
    if (!raw) return { ok: false };
    const saved = JSON.parse(raw) as { state: string; codeVerifier: string; redirect: string };
    try {
      const tokens = await authFor().idpCallback({
        code: data.code,
        state: data.state,
        error: data.error,
        expectedState: saved.state,
        codeVerifier: saved.codeVerifier,
        cartToken: readCartToken() ?? undefined,
      });
      signIn(tokens);
      clearCartToken();
      return { ok: true, redirect: safeRedirect(saved.redirect) };
    } catch (error) {
      if (error instanceof IdpCallbackError) return { ok: false };
      throw error;
    }
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const accessToken = readAccessToken();
  if (accessToken)
    await authFor()
      .signOut(accessToken)
      .catch(() => undefined);
  signOut();
  return { ok: true as const };
});

export const withdraw = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().optional() }))
  .handler(({ data }) =>
    attempt(async () => {
      const accessToken = readAccessToken();
      if (!accessToken) return { done: false };
      await authFor().withdraw(accessToken, { password: data.password || undefined });
      signOut();
      return { done: true };
    }),
  );

export const reconsent = createServerFn({ method: "POST" }).handler(() =>
  attempt(() => buyerApi().member.updateConsents({ terms: true, privacy: true })),
);
