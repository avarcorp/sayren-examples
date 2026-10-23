import type { Analytics, AnalyticsTrackInput } from "@sayren/storefront-sdk/analytics";
import { useEffect } from "react";
import type { RootData } from "./store";

/**
 * 방문 분석 — 브라우저 전용. 루트가 한 번 시작하고 화면은 `useTrack`으로 행동을 남긴다.
 * 장바구니·결제·구매 이벤트는 API가 서버에서 기록하므로 여기서 보내지 않는다.
 */
let instance: Analytics | null = null;
/** 시작 전에 들어온 행동 — 자식 effect가 루트 effect보다 먼저 돈다 */
let pending: AnalyticsTrackInput[] = [];

let disabled = false;

export async function startAnalytics(config: RootData["analytics"]) {
  if (instance) return;
  if (!config) {
    // 분석을 끈 모드(mock) — 쌓아 둔 행동을 버리고 더 받지 않는다
    disabled = true;
    pending = [];
    return;
  }
  const { createAnalytics } = await import("@sayren/storefront-sdk/analytics");
  if (instance) return;
  // 동의 배너가 없는 상점이라 바로 보낸다. 배너를 붙이면 "pending"으로 시작하고 setConsent를 부른다
  instance = createAnalytics({
    baseUrl: config.apiBaseUrl,
    storeCode: config.storeCode,
    debug: config.debug,
    consent: "granted",
  });
  for (const input of pending) instance.track(input);
  pending = [];
}

function track(input: AnalyticsTrackInput) {
  if (disabled) return;
  if (instance) instance.track(input);
  else pending.push(input);
}

/** 화면이 보일 때 행동을 한 번 남긴다. 내용이 같으면 다시 보내지 않는다. null이면 보내지 않는다 */
export function useTrack(input: AnalyticsTrackInput | null) {
  const key = input ? JSON.stringify(input) : "";
  useEffect(() => {
    if (key) track(JSON.parse(key) as AnalyticsTrackInput);
  }, [key]);
}
