import { z } from "zod";

const BASE = "http://same.invalid";

/**
 * 로그인 뒤 돌아갈 주소 — 같은 사이트 경로만 받는다. 브라우저는 URL의 탭·개행을 지우고 `\`를 `/`로 읽으므로
 * 제어 문자를 거부하고, 브라우저처럼 해석한 결과의 출처가 그대로인지 본다(`/%09/evil.com`·`//evil.com` 차단).
 */
export function safeRedirect(value: string | undefined | null): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: 제어 문자를 거르는 것이 목적이다
  if (!value?.startsWith("/") || /[\u0000-\u001f\u007f]/.test(value)) return "/";
  const url = new URL(value, BASE);
  if (url.origin !== BASE) return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}

export const redirectSearch = z.object({
  redirectTo: z.string().max(500).optional().catch(undefined),
});
