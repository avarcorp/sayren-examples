import type { CustomInputView } from "@sayren/storefront-sdk";
import { useState } from "react";
import {
  checkInputImage,
  createInputImageUploadFn,
  INPUT_IMAGE_ACCEPT,
} from "../../lib/input-image-upload";
import {
  datetimeInputToValue,
  imageUrlsOf,
  inputKindOf,
  valueToDatetimeInput,
} from "../../lib/product-options";

interface Props {
  /** 칸 id — 같은 상품의 구매 영역이 두 번 렌더되므로 부르는 쪽이 고유하게 준다 */
  id: string;
  input: CustomInputView;
  value: string;
  onChange: (value: string) => void;
  problem?: string;
}

const FIELD = "h-12 w-full border-0 border-ink border-b bg-transparent text-lead outline-none";

/** 직접 입력 한 칸 — 글·숫자·선택·날짜·일시·이미지. 값은 담기 요청 본문으로만 나간다 */
export function CustomInputField({ id, input, value, onChange, problem }: Props) {
  const kind = inputKindOf(input);
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-medium text-small">
        {input.label}
        {input.required ? null : <span className="ml-1.5 font-normal text-muted">선택</span>}
        {kind === "text" ? (
          <span className="ml-1.5 font-normal text-muted">최대 {input.maxLength}자</span>
        ) : null}
      </label>
      {kind === "select" ? (
        <select
          id={id}
          className={FIELD}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={problem ? true : undefined}
          aria-describedby={problem ? `${id}-problem` : undefined}
        >
          <option value="">선택 안 함</option>
          {(input.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : kind === "image" ? (
        <ImageInput id={id} max={input.maxLength} value={value} onChange={onChange} />
      ) : (
        <input
          id={id}
          className={FIELD}
          type={
            kind === "number"
              ? "number"
              : kind === "date"
                ? "date"
                : kind === "datetime"
                  ? "datetime-local"
                  : "text"
          }
          placeholder={input.placeholder ?? undefined}
          value={kind === "datetime" ? valueToDatetimeInput(value) : value}
          onChange={(e) =>
            onChange(kind === "datetime" ? datetimeInputToValue(e.target.value) : e.target.value)
          }
          aria-invalid={problem ? true : undefined}
          aria-describedby={problem ? `${id}-problem` : undefined}
        />
      )}
      {problem ? (
        <p id={`${id}-problem`} className="text-primary text-small">
          {problem}
        </p>
      ) : null}
    </div>
  );
}

/** 이미지 입력 — 서버 함수가 업로드 자리를 받고 브라우저가 그 주소로 바로 올린다. 값은 공개 주소를 줄바꿈으로 잇는다 */
function ImageInput({
  id,
  max,
  value,
  onChange,
}: {
  id: string;
  max: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const urls = imageUrlsOf(value);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function upload(file: File) {
    setError(null);
    const check = checkInputImage(file);
    if (check !== "OK") {
      setError(
        check === "FILE_TOO_LARGE"
          ? "10MB 이하 이미지만 올릴 수 있습니다."
          : "JPG·PNG·WEBP·AVIF·GIF만 올릴 수 있습니다.",
      );
      return;
    }
    setBusy(true);
    try {
      const slot = await createInputImageUploadFn({
        data: { filename: file.name, size: file.size },
      });
      if ("failure" in slot) throw new Error(slot.failure);
      const put = await fetch(slot.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "content-type": file.type },
      });
      if (!put.ok) throw new Error("upload");
      onChange([...urls, slot.url].join("\n"));
    } catch {
      setError("이미지를 올리지 못했습니다. 다시 시도하십시오.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {urls.map((u) => (
        <img key={u} src={u} alt="" className="size-16 object-cover" />
      ))}
      {urls.length < max ? (
        <label
          htmlFor={id}
          className="flex h-16 cursor-pointer items-center border border-ink border-dashed px-4 text-small"
        >
          {busy ? "올리는 중" : "이미지 추가"}
          <input
            id={id}
            type="file"
            accept={INPUT_IMAGE_ACCEPT}
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
        </label>
      ) : null}
      {error ? (
        <p role="alert" className="w-full text-primary text-small">
          {error}
        </p>
      ) : null}
    </div>
  );
}
