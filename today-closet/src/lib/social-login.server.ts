import { clearServerCookie, readServerCookie, writeServerCookie } from "./cookies.server";

/**
 * 소셜 로그인 왕복 상태 — 공급자로 보내기 전에 만든 state·PKCE verifier·돌아갈 곳을 HttpOnly 쿠키에 잠깐 둔다.
 * 돌아오면 state를 비교하고 verifier로 1회용 code를 토큰으로 바꾼 뒤 지운다. 10분이 지나면 사라진다.
 */
const SOCIAL_COOKIE = "sayren_social";

export interface SocialLoginState {
  state: string;
  codeVerifier: string;
  redirectTo: string;
  /** 로그인한 구매자가 소셜 계정을 연결하는 흐름이면 그 공급자 — 콜백이 로그인 대신 연결로 마무리한다 */
  linkProvider?: "kakao" | "naver" | "google";
}

export function writeSocialLogin(value: SocialLoginState) {
  writeServerCookie(SOCIAL_COOKIE, JSON.stringify(value), 60 * 10);
}

export function readSocialLogin(): SocialLoginState | null {
  const raw = readServerCookie(SOCIAL_COOKIE);
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const stored = value as Partial<SocialLoginState>;
  if (typeof stored.state !== "string" || typeof stored.codeVerifier !== "string") return null;
  return {
    state: stored.state,
    codeVerifier: stored.codeVerifier,
    redirectTo: typeof stored.redirectTo === "string" ? stored.redirectTo : "/",
    linkProvider:
      stored.linkProvider === "kakao" ||
      stored.linkProvider === "naver" ||
      stored.linkProvider === "google"
        ? stored.linkProvider
        : undefined,
  };
}

export function clearSocialLogin() {
  clearServerCookie(SOCIAL_COOKIE);
}
