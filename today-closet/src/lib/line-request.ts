import { lineSelectionRequestShape } from "@sayren/storefront-sdk";
import { z } from "zod";

/** 쿠키 한 개는 이름·속성까지 4KB다. 넘으면 브라우저가 조용히 버리므로 먼저 거절한다 */
const MAX_VALUE_BYTES = 3500;

/**
 * 장바구니 담기·바로구매 한 줄 — 조합(optionId) + 추가 선택 값 + 직접 입력값.
 * 직접 입력값은 서버 함수 본문과 HttpOnly 쿠키로만 다닌다(`direct-checkout.server.ts`). URL에 싣지 않는다.
 */
export const lineRequestSchema = z.object({
  productId: z.string(),
  optionId: z.string().optional(),
  quantity: z.number().int().min(1).max(999),
  ...lineSelectionRequestShape,
});
export type LineRequest = z.infer<typeof lineRequestSchema>;

export class LineTooLargeError extends Error {}

/** 웹 표준 API만 쓴다 — Node 밖(Workers 등) 호스팅에서도 같게 돈다 */
function toBase64Url(text: string): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

/** base64url(JSON) — 한글이 퍼센트 인코딩(글자당 9바이트)보다 짧다(글자당 4바이트) */
export function encodeLine(line: LineRequest): string {
  const value = toBase64Url(JSON.stringify(line));
  if (value.length > MAX_VALUE_BYTES) throw new LineTooLargeError();
  return value;
}

export function decodeLine(value: string | undefined | null): LineRequest | null {
  if (!value) return null;
  try {
    const parsed = lineRequestSchema.safeParse(JSON.parse(fromBase64Url(value)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
