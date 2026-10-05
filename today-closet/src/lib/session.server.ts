import { ApiError, type TokenPair } from "@sayren/storefront-sdk/auth";
import { getGlobalStartContext } from "@tanstack/react-start";
import { authFor } from "./api.server";
import { clearServerCookie, readServerCookie, writeServerCookie } from "./cookies.server";

/**
 * 구매자 세션 — 로그인 토큰 쌍을 HttpOnly 쿠키 하나에 둔다. 브라우저 JS는 토큰을 읽지 못하고,
 * 서버(서버 함수·서버 라우트)만 쓴다.
 *
 * 액세스 토큰은 30분이라 `refreshBuyerSession`(전역 요청 미들웨어, `start.ts`)이 요청마다 만료를 보고,
 * 곧 끝나면 리프레시 토큰으로 새 쌍을 받아 쿠키를 갈아 끼운다. 리프레시 토큰이 거부되면(401: 14일 만료·폐기)
 * 쿠키를 지워 로그아웃 상태가 된다. 네트워크 오류·5xx 같은 일시 장애에는 쿠키를 지우지 않는다 — 다음 요청에서
 * 다시 갱신한다.
 *
 * 쿠키 이름은 프로덕션에서 `__Host-sayren_member`다(`cookies.server.ts`).
 */
const SESSION_COOKIE = "sayren_member";
/** 리프레시 토큰 수명(14일)과 맞춘다 */
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 14;

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  /** 액세스 토큰 만료 시각(epoch ms) */
  expiresAt: number;
}

/** 만료 이만큼 전에 미리 갱신한다 — 요청 도중 만료로 401이 나지 않게 */
const REFRESH_LEEWAY_MS = 60_000;

/**
 * 같은 리프레시 토큰의 갱신을 한 번으로 모은다. 화면 이동 한 번에 서버 함수 요청이 여러 개 동시에 오는데,
 * 리프레시 토큰은 한 번 쓰면 폐기되므로 각자 갱신하면 늦은 쪽이 401을 받아 로그아웃된다.
 * 결과는 그 리프레시 토큰을 들고 온 요청에만 돌려준다(다른 구매자와 섞이지 않는다).
 */
const refreshing = new Map<string, Promise<TokenPair>>();
const REFRESH_SHARE_MS = 10_000;

function refreshOnce(refreshToken: string): Promise<TokenPair> {
  const inFlight = refreshing.get(refreshToken);
  if (inFlight) return inFlight;
  const next = authFor().refresh(refreshToken);
  refreshing.set(refreshToken, next);
  const forget = () => {
    setTimeout(() => refreshing.delete(refreshToken), REFRESH_SHARE_MS);
  };
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
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const session = value as Partial<StoredSession>;
  if (typeof session.accessToken !== "string" || typeof session.refreshToken !== "string")
    return null;
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: Number(session.expiresAt),
  };
}

function writeSession(session: StoredSession) {
  // HttpOnly — 브라우저 JS는 토큰을 읽지 못한다(`writeServerCookie`가 httpOnly·sameSite·secure를 싣는다)
  writeServerCookie(SESSION_COOKIE, JSON.stringify(session), SESSION_MAX_AGE_SEC);
}

/**
 * 이 요청의 액세스 토큰을 정한다. 만료가 가까우면 갱신하고 응답에 새 쿠키를 싣는다.
 * 전역 요청 미들웨어가 요청마다 한 번 부른다.
 */
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
    // 일시 장애면 이번 요청은 기존 토큰으로 진행한다(만료 전 여유 1분 안이면 아직 유효하다)
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

/** 로그아웃 — 쿠키를 지운다 */
export function signOut() {
  clearServerCookie(SESSION_COOKIE);
}
