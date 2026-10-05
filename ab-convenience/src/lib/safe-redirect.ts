/**
 * 로그인 뒤 이동할 곳 — 같은 사이트 경로만 받는다(외부 주소로 보내는 열린 리다이렉트 방지).
 * `//evil.com`과 `/\evil.com`은 브라우저가 외부 주소로 해석하므로 두 번째 글자가 `/`·`\`면 거부하고,
 * 제어 문자(탭·개행은 URL 파싱에서 지워진다)도 거부한다.
 */
export function safeRedirect(value: unknown): string {
  const fallback = "/orders";
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  if (value[1] === "/" || value[1] === "\\") return fallback;
  // biome-ignore lint/suspicious/noControlCharactersInRegex: 제어 문자를 거부하려고 찾는다
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  return value;
}
