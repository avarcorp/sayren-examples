import { clearServerCookie, readServerCookie, writeServerCookie } from "./cookies.server";

/**
 * 소셜 로그인 왕복 상태 — 공급자로 보내기 전에 만든 state·PKCE verifier·돌아갈 곳을 HttpOnly 쿠키에 10분 둔다.
 * 돌아오면 state를 비교하고 verifier로 1회용 code를 토큰으로 바꾼 뒤 지운다.
 */
const SOCIAL_COOKIE = "sayren_social";

export interface SocialLoginState {
  state: string;
  codeVerifier: string;
  redirectTo: string;
}

export function writeSocialLogin(value: SocialLoginState) {
  writeServerCookie(SOCIAL_COOKIE, JSON.stringify(value), 60 * 10);
}

export function readSocialLogin(): SocialLoginState | null {
  const raw = readServerCookie(SOCIAL_COOKIE);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<SocialLoginState> | null;
    if (!v || typeof v.state !== "string" || typeof v.codeVerifier !== "string") return null;
    return {
      state: v.state,
      codeVerifier: v.codeVerifier,
      redirectTo: typeof v.redirectTo === "string" ? v.redirectTo : "/",
    };
  } catch {
    return null;
  }
}

export function clearSocialLogin() {
  clearServerCookie(SOCIAL_COOKIE);
}
