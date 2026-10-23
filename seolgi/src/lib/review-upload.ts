import { reviewImageUploadFn } from "./account";

/** 리뷰 사진 올리기 — 서버 함수로 업로드 자리를 받고 브라우저가 그 주소로 바로 PUT한다. 실패하면 null */
export async function uploadReviewImage(file: File): Promise<string | null> {
  if (file.size > 10 * 1024 * 1024) return null;
  const slot = await reviewImageUploadFn({ data: { filename: file.name, size: file.size } });
  if (!slot) return null;
  const put = await fetch(slot.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "content-type": file.type },
  }).catch(() => null);
  return put?.ok ? slot.url : null;
}
