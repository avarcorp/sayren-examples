import { getRequest, getRequestHeader } from "@tanstack/react-start/server";
import { type PublicConfig, storeCodeFromHost } from "./config";

/**
 * 서버 전용 설정 — `.server.ts`라 브라우저 번들에 들어가지 않는다. `process.env`는 여기서만 읽는다.
 */
export const API_BASE_URL = process.env.SAYREN_API_URL ?? "https://api.sayren.io/storefront/v1";

/** mock 모드 — 운영 API 대신 `src/mock/`의 고정 데이터로 응답한다(사진·리뷰·주문이 있는 화면 확인용) */
export const MOCK = process.env.SAYREN_MOCK === "1";

/** localhost에서도 방문 분석을 보낸다 */
export const ANALYTICS_DEBUG = process.env.SAYREN_ANALYTICS_DEBUG === "1";

const FIXED_STORE_CODE = process.env.SAYREN_STORE_CODE ?? "";

/** 이 요청의 상점 — 환경변수가 먼저이고, 없으면 호스트 서브도메인에서 뽑는다 */
export function resolveStoreCode(): string {
  if (FIXED_STORE_CODE) return FIXED_STORE_CODE;
  const fromHost = storeCodeFromHost(getRequestHeader("host"));
  if (fromHost) return fromHost;
  throw new Error("상점 코드를 알 수 없습니다. SAYREN_STORE_CODE를 설정하십시오");
}

/**
 * 브라우저 결제 SDK에 내려 줄 공개 설정. mock 모드면 이 사이트의 mock API(`/mock-api`)를 가리킨다.
 * 구매자 토큰은 담지 않는다(결제 상태 조회는 결제 id만으로 한다).
 */
export function publicConfig(): PublicConfig {
  return {
    apiBaseUrl: MOCK ? `${new URL(getRequest().url).origin}/mock-api/storefront/v1` : API_BASE_URL,
    storeCode: resolveStoreCode(),
  };
}
