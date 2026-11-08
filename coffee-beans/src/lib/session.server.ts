import { ApiError, createStorefrontAuth, type TokenPair } from "@sayren/storefront-sdk/auth";
import { buyerTokenOf, sessionClearHeader, sessionSetHeader } from "@sayren/storefront-sdk/server";
import { getGlobalStartContext } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { API_BASE_URL, resolveStoreCode } from "./config.server";
import { clearServerCookie, readServerCookie, writeServerCookie } from "./cookies.server";

/**
 * 구매자 세션. 토큰은 모듈 변수에 두지 않고 요청마다 읽는다.
 * - sayren 호스팅: 플랫폼이 세션 쿠키를 관리한다. 토큰은 `buyerTokenOf(request)`, 로그인·로그아웃은 응답 헤더로 알린다.
 * - 로컬 개발(`pnpm dev`): 토큰 쌍을 HttpOnly 쿠키 하나에 두고 요청 미들웨어(`start.ts`)가 만료 1분 전에 갱신한다.
 *   갱신이 401이면 세션을 지우고, 네트워크 오류·5xx면 남긴다.
 */
const DEV = import.meta.env.DEV;
const DEV_SESSION = "wsg_member";
const DEV_SESSION_MAX_AGE = 60 * 60 * 24 * 14;
const REFRESH_BEFORE_MS = 60_000;

interface DevSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function authFor() {
  return createStorefrontAuth({ baseUrl: API_BASE_URL, storeCode: resolveStoreCode() });
}

function readDevSession(): DevSession | null {
  const raw = readServerCookie(DEV_SESSION);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DevSession>;
    if (typeof parsed.accessToken !== "string" || typeof parsed.refreshToken !== "string")
      return null;
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      expiresAt: Number(parsed.expiresAt),
    };
  } catch {
    return null;
  }
}

function writeDevSession(tokens: TokenPair) {
  const value: DevSession = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + tokens.expiresIn * 1000,
  };
  writeServerCookie(DEV_SESSION, JSON.stringify(value), DEV_SESSION_MAX_AGE);
}

/** 로그인·가입·소셜 로그인 성공 뒤 서버 함수 안에서 부른다 */
export function signIn(tokens: TokenPair) {
  const [name, value] = sessionSetHeader(tokens);
  setResponseHeader(name, value);
  if (DEV) writeDevSession(tokens);
}

/** 로그아웃·탈퇴 뒤 서버 함수 안에서 부른다 */
export function signOut() {
  const [name, value] = sessionClearHeader();
  setResponseHeader(name, value);
  if (DEV) clearServerCookie(DEV_SESSION);
}

/** 로컬 개발 요청 미들웨어 — 이 요청의 액세스 토큰을 정하고, 만료가 가까우면 갱신한다 */
export async function resolveDevAccessToken(): Promise<string | null> {
  if (!DEV) return null;
  const stored = readDevSession();
  if (!stored) return null;
  if (stored.expiresAt - REFRESH_BEFORE_MS > Date.now()) return stored.accessToken;
  try {
    const tokens = await authFor().refresh(stored.refreshToken);
    writeDevSession(tokens);
    return tokens.accessToken;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearServerCookie(DEV_SESSION);
      return null;
    }
    return stored.accessToken;
  }
}

/** 이 요청의 구매자 액세스 토큰. 로그인하지 않았으면 null */
export function readAccessToken(): string | null {
  const hosted = buyerTokenOf(getRequest());
  if (hosted) return hosted;
  if (!DEV) return null;
  const context = getGlobalStartContext() as { accessToken?: string | null } | undefined;
  return context?.accessToken ?? null;
}

/** 비회원 장바구니 토큰 — 서버가 `X-Cart-Token`으로 발급한다. 로그인하면 회원 장바구니로 합친 뒤 지운다 */
const CART = "wsg_cart";
const CART_MAX_AGE = 60 * 60 * 24 * 30;

export function readCartToken(): string | null {
  return readServerCookie(CART) || null;
}

export function writeCartToken(token: string) {
  writeServerCookie(CART, token, CART_MAX_AGE);
}

export function clearCartToken() {
  clearServerCookie(CART);
}
