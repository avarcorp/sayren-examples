/** 브라우저와 서버가 함께 쓰는 설정 모양 — 값은 서버 함수가 내려준다 */
export interface PublicConfig {
  apiBaseUrl: string;
  storeCode: string;
}

/** `{코드}.sayren.co` 같은 호스팅 주소에서 상점 코드를 뽑는다 */
export function storeCodeFromHost(host: string | undefined): string | null {
  if (!host) return null;
  const name = host.split(":")[0] ?? "";
  const match = /^([a-z0-9]+)\.(?:sayren\.co|store\.sayren\.io)$/.exec(name);
  return match?.[1] ?? null;
}
