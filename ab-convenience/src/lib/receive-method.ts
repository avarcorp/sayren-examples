import { useSyncExternalStore } from "react";

/**
 * 받는 방법 — 배달(`DIRECT`)·포장(`PICKUP`). 홈·장바구니·상품 화면이 같은 값을 쓰고, 주문서는 주소의 `method`로 받아
 * 주문서 `fulfillmentMethod`로 보낸다(서버가 상품마다 허용하는지 판정한다).
 *
 * 브라우저에만 둔다(localStorage). 서버 렌더는 기본값(배달)으로 그리고 브라우저가 이어받아 바꾼다.
 */
export const RECEIVE_METHODS = ["DIRECT", "PICKUP"] as const;
export type ReceiveMethod = (typeof RECEIVE_METHODS)[number];

const KEY = "ab.receive-method";
const EVENT = "ab:receive-method";
const DEFAULT: ReceiveMethod = "DIRECT";

export function isReceiveMethod(value: unknown): value is ReceiveMethod {
  return value === "DIRECT" || value === "PICKUP";
}

function read(): ReceiveMethod {
  try {
    const value = window.localStorage.getItem(KEY);
    return isReceiveMethod(value) ? value : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function setReceiveMethod(method: ReceiveMethod) {
  try {
    window.localStorage.setItem(KEY, method);
  } catch {
    // 저장하지 못해도 이번 화면에서는 바뀐다
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: method }));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useReceiveMethod(): ReceiveMethod {
  return useSyncExternalStore(subscribe, read, () => DEFAULT);
}

/** 상품이 이 방법을 받는가 — 상품 상세 `fulfillment.methods`. 방법 목록이 없으면(옛 응답) 막지 않는다 */
export function productAccepts(methods: readonly string[] | undefined, method: ReceiveMethod) {
  return !methods?.length || methods.includes(method);
}
