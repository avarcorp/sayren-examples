/**
 * 리뷰 사진 목록 — 최대 5장, 순서가 곧 표시 순서다. 형식·크기는 서버 규칙(상품 이미지와 같은 정지 이미지)을
 * 미리 검사해 업로드 자리를 헛되이 발급받지 않는다. 최종 판정은 서버가 한다(400·413).
 */
export const MAX_REVIEW_IMAGES = 5;
export const MAX_REVIEW_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export type ImageCheck = "OK" | "UNSUPPORTED_FILE_TYPE" | "FILE_TOO_LARGE";

export function checkImageFile(file: { type: string; size: number }): ImageCheck {
  if (!ALLOWED_TYPES.includes(file.type)) return "UNSUPPORTED_FILE_TYPE";
  if (file.size > MAX_REVIEW_IMAGE_BYTES) return "FILE_TOO_LARGE";
  return "OK";
}

/** 더 올릴 수 있는 장수 */
export function remainingSlots(images: readonly string[]): number {
  return Math.max(0, MAX_REVIEW_IMAGES - images.length);
}

/** `index`의 사진을 `delta`만큼 옮긴다(-1 앞으로, 1 뒤로). 끝을 넘으면 그대로다 */
export function moveImage(images: readonly string[], index: number, delta: -1 | 1): string[] {
  const target = index + delta;
  if (index < 0 || index >= images.length || target < 0 || target >= images.length) {
    return [...images];
  }
  const next = [...images];
  [next[index], next[target]] = [next[target] as string, next[index] as string];
  return next;
}

export function removeImage(images: readonly string[], index: number): string[] {
  return images.filter((_, i) => i !== index);
}

/** 새 주소를 붙이되 최대 장수를 넘기지 않는다 */
export function appendImages(images: readonly string[], urls: readonly string[]): string[] {
  return [...images, ...urls].slice(0, MAX_REVIEW_IMAGES);
}
