import { createStorefrontClient } from "@sayren/storefront-sdk";
import type { PublicConfig } from "./config";

/** 브라우저용 — 서버 함수가 내려준 공개 설정으로 만든다(결제창·결제 상태 조회에만 쓴다) */
export function browserApi(config: PublicConfig) {
  return createStorefrontClient({ baseUrl: config.apiBaseUrl, storeCode: config.storeCode });
}
