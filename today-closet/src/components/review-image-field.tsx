import { Plus, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { m } from "../i18n";
import { createReviewImageUpload, type UploadFailure } from "../lib/my-reviews";
import {
  appendImages,
  checkImageFile,
  MAX_REVIEW_IMAGES,
  moveImage,
  remainingSlots,
  removeImage,
} from "../lib/review-images";

const FAILURE_MESSAGE: Record<UploadFailure, () => string> = {
  UNSUPPORTED_FILE_TYPE: () => m.rw_photo_type(),
  FILE_TOO_LARGE: () => m.rw_photo_size(),
  TOO_MANY_REQUESTS: () => m.rw_photo_rate(),
  UNKNOWN: () => m.rw_photo_failed(),
};

/**
 * 리뷰 사진 첨부 — 고른 파일마다 서버 함수로 업로드 자리를 받고(구매자 토큰은 서버에만), 브라우저가 서명된
 * `uploadUrl`에 바로 PUT한다. 끝나면 공개 주소(`url`)를 목록에 붙인다. 미리보기·삭제·앞뒤 순서 바꾸기.
 */
export function ReviewImageField({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slots = remainingSlots(images);

  const upload = async (files: File[]) => {
    setError(null);
    if (files.length > slots) setError(m.rw_photo_limit({ max: MAX_REVIEW_IMAGES }));
    const picked = files.slice(0, slots);
    if (!picked.length) return;
    setUploading(true);
    const urls: string[] = [];
    // 한 장씩 — 연타 한도(429)를 피하고 순서를 지킨다
    for (const file of picked) {
      const check = checkImageFile(file);
      if (check !== "OK") {
        setError(FAILURE_MESSAGE[check]());
        continue;
      }
      const ticket = await createReviewImageUpload({
        data: { filename: file.name, size: file.size },
      }).catch(() => ({ failure: "UNKNOWN" as const }));
      if ("failure" in ticket) {
        setError(FAILURE_MESSAGE[ticket.failure]());
        if (ticket.failure === "TOO_MANY_REQUESTS") break;
        continue;
      }
      const put = await fetch(ticket.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      }).catch(() => null);
      if (!put?.ok) {
        setError(m.rw_photo_failed());
        continue;
      }
      urls.push(ticket.url);
    }
    onChange(appendImages(images, urls));
    setUploading(false);
  };

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 font-bold text-body">{m.rw_photo_title()}</legend>
      <p className="text-caption text-muted">{m.rw_photo_hint({ max: MAX_REVIEW_IMAGES })}</p>
      <ul className="flex flex-wrap gap-2">
        {images.map((src, index) => (
          <li key={src} className="relative size-20 bg-chip">
            <img
              src={src}
              alt={m.rw_photo_alt({ index: index + 1 })}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 text-white text-xs">
              <button
                type="button"
                aria-label={m.rw_photo_left({ index: index + 1 })}
                disabled={index === 0}
                onClick={() => onChange(moveImage(images, index, -1))}
                className="px-1.5 disabled:opacity-30"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label={m.rw_photo_right({ index: index + 1 })}
                disabled={index === images.length - 1}
                onClick={() => onChange(moveImage(images, index, 1))}
                className="px-1.5 disabled:opacity-30"
              >
                ›
              </button>
            </div>
            <button
              type="button"
              aria-label={m.rw_photo_remove({ index: index + 1 })}
              onClick={() => onChange(removeImage(images, index))}
              className="absolute top-0 right-0 flex size-6 items-center justify-center bg-black/60 text-white text-xs"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </li>
        ))}
        {slots > 0 ? (
          <li>
            <label
              htmlFor={inputId}
              className={`flex size-20 cursor-pointer flex-col items-center justify-center gap-1 border border-line-strong border-dashed text-caption text-muted hover:border-ink hover:text-ink ${uploading ? "opacity-50" : ""}`}
            >
              <Plus aria-hidden="true" className="size-5" />
              {m.rw_photo_add()}
            </label>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              multiple
              disabled={uploading}
              className="sr-only"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                void upload(files);
              }}
            />
          </li>
        ) : null}
      </ul>
      {uploading ? (
        <p role="status" className="text-caption text-muted">
          {m.rw_photo_uploading()}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-caption text-point">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
