import { ApiError, type StorefrontStore } from "@sayren/storefront-sdk";
import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";
import { authFor } from "./api.server";
import { clearCartToken, readCartToken } from "./cart-session.server";
import { clearDirectLine } from "./direct-checkout.server";
import { safeRedirect } from "./safe-redirect";
import { readToken, signIn, signOut } from "./session.server";
import { writeSocialLogin } from "./social-login.server";

export type SocialProvider = Exclude<StorefrontStore["loginMethods"][number], "password">;

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "INVALID_CREDENTIALS") return "이메일 또는 비밀번호가 맞지 않습니다.";
    if (error.code === "PASSWORD_LOGIN_DISABLED") return "이메일 로그인을 쓰지 않는 상점입니다.";
    if (error.code === "ACCOUNT_LOCKED")
      return "로그인을 여러 번 실패해 잠시 막았습니다. 잠시 뒤 다시 시도하십시오.";
    if (error.code === "EMAIL_ALREADY_EXISTS") return "이미 가입한 이메일입니다. 로그인하십시오.";
    if (error.status === 400) return "입력한 내용을 다시 확인하십시오.";
  }
  return "로그인하지 못했습니다. 잠시 뒤 다시 시도하십시오.";
}

/**
 * 이메일 로그인 — 비회원 장바구니 토큰을 함께 보내 회원 장바구니로 합친다(토큰은 닫혀 쿠키도 지운다).
 * 결과 토큰은 HttpOnly 쿠키에만 둔다.
 */
export const passwordLoginFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().max(200),
      password: z.string().max(200),
      redirectTo: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const cartToken = readCartToken();
    try {
      signIn(
        await authFor().session({
          email: data.email,
          password: data.password,
          cartToken: cartToken ?? undefined,
        }),
      );
      if (cartToken) clearCartToken();
      return { redirectTo: safeRedirect(data.redirectTo), error: null };
    } catch (error) {
      return { redirectTo: null, error: loginErrorMessage(error) };
    }
  });

/** 회원가입 — 약관·개인정보 동의는 필수, 마케팅 수신은 선택. 가입하면 바로 로그인한다 */
export const signupFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string(),
      password: z.string(),
      name: z.string(),
      phone: z.string().optional(),
      marketing: z.boolean(),
      redirectTo: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const cartToken = readCartToken();
    try {
      signIn(
        await authFor().signUp({
          email: data.email,
          password: data.password,
          name: data.name,
          ...(data.phone ? { phone: data.phone } : {}),
          agreements: { terms: true, privacy: true, marketing: data.marketing },
          cartToken: cartToken ?? undefined,
        }),
      );
      if (cartToken) clearCartToken();
      return { redirectTo: safeRedirect(data.redirectTo), error: null };
    } catch (error) {
      return { redirectTo: null, error: loginErrorMessage(error) };
    }
  });

/**
 * 소셜 로그인 시작 — state·PKCE verifier를 쿠키에 두고 공급자 로그인 화면 주소를 돌려준다.
 * 돌아오는 곳은 `/auth/callback`이다(상점 플랫폼에 스토어프론트 도메인이 등록돼 있어야 한다).
 */
export const startSocialFn = createServerFn({ method: "POST" })
  .validator(
    z.object({ provider: z.enum(["kakao", "naver", "google"]), redirectTo: z.string().optional() }),
  )
  .handler(async ({ data }) => {
    const origin = new URL(getRequestUrl()).origin;
    try {
      const started = await authFor().idp(data.provider, {
        redirectUri: `${origin}/auth/callback`,
      });
      writeSocialLogin({
        state: started.state,
        codeVerifier: started.codeVerifier,
        redirectTo: safeRedirect(data.redirectTo),
      });
      return { url: started.url, error: null };
    } catch (error) {
      return { url: null, error: loginErrorMessage(error) };
    }
  });

/** 로그아웃 — sayren 세션을 닫고 쿠키를 지운다(세션 닫기가 실패해도 쿠키는 지운다) */
export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const accessToken = readToken();
  if (accessToken)
    await authFor()
      .signOut(accessToken)
      .catch(() => undefined);
  signOut();
  // 공용 PC에서 다음 사람이 바로구매 입력값(각인 문구 등)을 이어 쓰지 않게 지운다
  clearDirectLine();
  return { ok: true };
});
