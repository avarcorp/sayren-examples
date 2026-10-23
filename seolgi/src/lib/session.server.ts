import { ApiError, type TokenPair } from "@sayren/storefront-sdk/auth";
import { getGlobalStartContext } from "@tanstack/react-start";
import { authFor } from "./api.server";
import { clearServerCookie, readServerCookie, writeServerCookie } from "./cookies.server";

/**
 * 구매자 세션 — 토큰 쌍을 HttpOnly 쿠키 하나에 둔다. 브라우저 JS는 토큰을 읽지 못한다.
 * 전역 요청 미들웨어(`start.ts`)가 요청마다 만료를 보고 1분 전이면 갱신한다. 리프레시가 401이면 로그아웃하고,
 * 네트워크 오류·5xx는 쿠키를 지우지 않는다(다음 요청에서 다시 갱신한다).
 */
const SESSION_COOKIE = "sayren_member";
/** 리프레시 토큰 수명(14일)과 맞춘다 */
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 14;
const REFRESH_LEEWAY_MS = 60_000;

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  /** 액세스 토큰 만료 시각(epoch ms) */
  expiresAt: number;
}

/**
 * 같은 리프레시 토큰의 갱신을 한 번으로 모은다 — 화면 이동 한 번에 서버 함수가 여럿 동시에 오는데
 * 리프레시 토큰은 한 번 쓰면 폐기되어 늦은 쪽이 로그아웃된다. 결과는 그 토큰을 든 요청에만 돌려준다.
 */
const refreshing = new Map<string, Promise<TokenPair>>();
const REFRESH_SHARE_MS = 10_000;

function refreshOnce(refreshToken: string): Promise<TokenPair> {
  const inFlight = refreshing.get(refreshToken);
  if (inFlight) return inFlight;
  const next = authFor().refresh(refreshToken);
  refreshing.set(refreshToken, next);
  const forget = () => setTimeout(() => refreshing.delete(refreshToken), REFRESH_SHARE_MS);
  next.then(forget, forget);
  return next;
}

function toStored(tokens: TokenPair): StoredSession {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + tokens.expiresIn * 1000,
  };
}

function readSession(): StoredSession | null {
  const raw = readServerCookie(SESSION_COOKIE);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredSession> | null;
    if (!value || typeof value.accessToken !== "string" || typeof value.refreshToken !== "string") {
      return null;
    }
    return {
      accessToken: value.accessToken,
      refreshToken: value.refreshToken,
      expiresAt: Number(value.expiresAt),
    };
  } catch {
    return null;
  }
}

function writeSession(session: StoredSession) {
  writeServerCookie(SESSION_COOKIE, JSON.stringify(session), SESSION_MAX_AGE_SEC);
}

/** 이 요청의 액세스 토큰을 정한다 — 전역 요청 미들웨어가 요청마다 한 번 부른다 */
export async function refreshBuyerSession(): Promise<string | null> {
  const stored = readSession();
  if (!stored) return null;
  // 만료 시각을 모르면(형식이 다른 쿠키) 만료로 본다
  if (stored.expiresAt - REFRESH_LEEWAY_MS > Date.now()) return stored.accessToken;
  try {
    const refreshed = toStored(await refreshOnce(stored.refreshToken));
    writeSession(refreshed);
    return refreshed.accessToken;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      signOut();
      return null;
    }
    return stored.accessToken;
  }
}

/** 이 요청의 구매자 액세스 토큰 — 로그인하지 않았으면 null */
export function readToken(): string | null {
  return getGlobalStartContext()?.accessToken ?? null;
}

/** 로그인·가입 직후 응답에 쿠키를 싣는다 */
export function signIn(tokens: TokenPair) {
  writeSession(toStored(tokens));
}

export function signOut() {
  clearServerCookie(SESSION_COOKIE);
}
