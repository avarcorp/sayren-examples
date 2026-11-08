/**
 * 브라우저와 서버가 함께 쓰는 값만 둔다. `process.env`는 여기에 두지 않는다 —
 * 브라우저 번들에 들어가면 `process is not defined`로 화면이 깨진다(서버 값은 `config.server.ts`).
 */

/** 호스트에서 서브도메인을 뽑는다(`mystore.example.com` → `mystore`) */
export function storeCodeFromHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0] ?? "";
  if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null;
  const labels = hostname.split(".");
  return labels.length >= 3 ? (labels[0] ?? null) : null;
}

/** 서버 함수가 브라우저로 내려주는 값 */
export interface PublicConfig {
  apiBaseUrl: string;
  storeCode: string;
}
