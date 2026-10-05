import {
  type AddonGroupView,
  type CustomInputView,
  customInputLength,
} from "@sayren/storefront-sdk";
import { useId, useState } from "react";
import { m } from "../i18n";
import { formatPrice } from "../lib/format";
import {
  checkInputImage,
  createInputImageUpload,
  INPUT_IMAGE_ACCEPT,
  type InputImageFailure,
} from "../lib/input-image-upload";
import {
  additionalPriceLabel,
  addonKey,
  datetimeInputToValue,
  datetimeValueToInput,
  imageUrlsOf,
  inputKey,
  inputKindOf,
  type OptionSelection,
  type SelectionProblem,
} from "../lib/product-options";
import { inputClass } from "./ui/button";

/** 칸마다 붙는 id — 담기 전 검사가 첫 문제 칸으로 포커스를 옮길 때 쓴다 */
export const optionFieldDomId = (key: string) => `option-field-${key}`;

/** 입력이 길면 여러 줄 칸으로 받는다 */
const MULTILINE_FROM = 41;

/**
 * 추가 선택과 직접 입력 칸 — 값은 부모가 들고(controlled) 담기 요청 본문으로만 보낸다.
 *
 * - 라벨이 곧 접근성 이름이다(`aria-label`). 필수 표시·안내·글자 수는 눈으로 보고, 보조 기술에는
 *   `required`·`aria-describedby`로 알린다.
 * - 칸은 서버 HTML에 값이 없다(처음엔 비어 있다). 하이드레이션 전에 적거나 고른 값은 React 상태에 들어가지 않아
 *   화면 가격·담기 요청에서 빠지므로 칸을 하이드레이션 뒤에만 쓸 수 있게 한다(`hydrated`).
 */
export function ProductOptionFields({
  addonGroups,
  customInputs,
  selection,
  problems,
  hydrated,
  onChange,
}: {
  addonGroups: AddonGroupView[];
  customInputs: CustomInputView[];
  selection: OptionSelection;
  problems: SelectionProblem[];
  hydrated: boolean;
  onChange: (next: OptionSelection) => void;
}) {
  const problemOf = (key: string) => problems.find((problem) => problem.key === key)?.message;
  return (
    <>
      {addonGroups.map((group) => (
        <AddonSelect
          key={group.groupId}
          group={group}
          value={selection.addons[group.groupId] ?? ""}
          problem={problemOf(addonKey(group.groupId))}
          disabled={!hydrated}
          onChange={(valueId) =>
            onChange({ ...selection, addons: { ...selection.addons, [group.groupId]: valueId } })
          }
        />
      ))}
      {customInputs.map((field) => (
        <CustomInput
          key={field.inputId}
          field={field}
          value={selection.inputs[field.inputId] ?? ""}
          problem={problemOf(inputKey(field.inputId))}
          disabled={!hydrated}
          onChange={(value) =>
            onChange({ ...selection, inputs: { ...selection.inputs, [field.inputId]: value } })
          }
        />
      ))}
    </>
  );
}

function FieldLabel({ label, required }: { label: string; required: boolean }) {
  return (
    <span className="font-bold text-body">
      {label}
      {required ? (
        <span aria-hidden="true" className="text-point">
          {" "}
          *
        </span>
      ) : (
        <span aria-hidden="true" className="font-normal text-caption text-muted">
          {" "}
          ({m.product_option_fields_optional()})
        </span>
      )}
    </span>
  );
}

function AddonSelect({
  group,
  value,
  problem,
  disabled,
  onChange,
}: {
  group: AddonGroupView;
  value: string;
  problem?: string;
  disabled: boolean;
  onChange: (valueId: string) => void;
}) {
  const problemId = useId();
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <FieldLabel label={group.name} required={group.required} />
      <select
        id={optionFieldDomId(addonKey(group.groupId))}
        disabled={disabled}
        value={value}
        aria-required={group.required}
        aria-label={group.name}
        aria-invalid={problem ? true : undefined}
        aria-describedby={problem ? problemId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass({ invalid: Boolean(problem), className: "disabled:bg-chip" })}
      >
        {/* 필수가 아니면 「선택 안 함」이 먼저 보인다. 필수는 고를 때까지 빈 값이라 담기 전에 막힌다 */}
        <option value="">
          {group.required ? m.product_option_fields_choose() : m.product_option_fields_none()}
        </option>
        {group.values.map((option) => (
          <option key={option.valueId} value={option.valueId}>
            {option.name}
            {additionalPriceLabel(option.additionalPrice, formatPrice)}
          </option>
        ))}
      </select>
      {problem ? (
        <span id={problemId} className="block text-caption text-point">
          {problem}
        </span>
      ) : null}
    </label>
  );
}

function CustomInput({
  field,
  value,
  problem,
  disabled,
  onChange,
}: {
  field: CustomInputView;
  value: string;
  problem?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const hintId = useId();
  const problemId = useId();
  const kind = inputKindOf(field);
  // 글자 수는 글자로 적는 칸에만 있다. 이미지는 장수, 고르는 칸(선택·날짜·일시)은 세지 않는다
  const counted = kind === "text" || kind === "number" || kind === "image";
  const length = kind === "image" ? imageUrlsOf(value).length : customInputLength(value);
  const over = counted && length > field.maxLength;
  const describedBy = [counted ? hintId : null, problem ? problemId : null]
    .filter(Boolean)
    .join(" ");
  const common = {
    id: optionFieldDomId(inputKey(field.inputId)),
    disabled,
    required: field.required,
    "aria-label": field.label,
    "aria-invalid": problem || over ? true : undefined,
    "aria-describedby": describedBy || undefined,
    className: `w-full min-w-0 rounded-control border bg-page px-3.5 text-body text-ink placeholder:text-muted focus:border-ink focus:outline-none disabled:bg-chip ${problem || over ? "border-point" : "border-line-strong"}`,
  } as const;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={common.id} className="flex items-baseline justify-between gap-3">
        <FieldLabel label={field.label} required={field.required} />
        {/* 글자 수는 눈으로만 본다 — 보조 기술에는 최대 글자 수 안내(hint)가 한 번 읽힌다 */}
        {counted ? (
          <span
            aria-hidden="true"
            className={`tabular text-caption ${over ? "text-point" : "text-muted"}`}
          >
            {length}/{field.maxLength}
          </span>
        ) : null}
      </label>
      {kind === "select" ? (
        <select
          {...common}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${common.className} h-12`}
        >
          <option value="">{m.product_option_fields_choose()}</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : kind === "number" ? (
        <input
          {...common}
          type="number"
          inputMode="numeric"
          step={1}
          value={value}
          placeholder={field.placeholder ?? undefined}
          onChange={(event) => onChange(event.target.value)}
          className={`${common.className} h-12`}
        />
      ) : kind === "date" ? (
        <input
          {...common}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${common.className} h-12`}
        />
      ) : kind === "datetime" ? (
        <input
          {...common}
          type="datetime-local"
          value={datetimeValueToInput(value)}
          onChange={(event) => onChange(datetimeInputToValue(event.target.value))}
          className={`${common.className} h-12`}
        />
      ) : kind === "image" ? (
        <InputImages
          id={common.id}
          label={field.label}
          max={field.maxLength}
          urls={imageUrlsOf(value)}
          disabled={disabled}
          describedBy={common["aria-describedby"]}
          onChange={(urls) => onChange(urls.join("\n"))}
        />
      ) : field.maxLength >= MULTILINE_FROM ? (
        <textarea
          {...common}
          value={value}
          placeholder={field.placeholder ?? undefined}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
          className={`${common.className} resize-none py-2`}
        />
      ) : (
        <input
          {...common}
          type="text"
          value={value}
          placeholder={field.placeholder ?? undefined}
          onChange={(event) => onChange(event.target.value)}
          className={`${common.className} h-12`}
        />
      )}
      {counted ? (
        <span id={hintId} className="sr-only">
          {kind === "image"
            ? m.product_option_fields_max_images({ max: field.maxLength })
            : m.product_option_fields_max_length({ max: field.maxLength })}
        </span>
      ) : null}
      {problem ? (
        <span id={problemId} className="block text-caption text-point">
          {problem}
        </span>
      ) : null}
    </div>
  );
}

const IMAGE_FAILURE: Record<InputImageFailure, () => string> = {
  UNSUPPORTED_FILE_TYPE: () => m.product_option_fields_image_type(),
  FILE_TOO_LARGE: () => m.product_option_fields_image_size(),
  TOO_MANY_REQUESTS: () => m.product_option_fields_image_rate(),
  UNKNOWN: () => m.product_option_fields_image_failed(),
};

/**
 * 이미지 입력 — 고른 파일마다 서버 함수로 업로드 자리를 받고 브라우저가 `uploadUrl`에 바로 PUT한다.
 * 끝난 공개 주소를 입력값(줄바꿈)으로 잇는다. 최대 장수는 항목의 `maxLength`다
 */
function InputImages({
  id,
  label,
  max,
  urls,
  disabled,
  describedBy,
  onChange,
}: {
  id: string;
  label: string;
  max: number;
  urls: string[];
  disabled: boolean;
  describedBy?: string;
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slots = Math.max(0, max - urls.length);

  const upload = async (files: File[]) => {
    setError(null);
    if (files.length > slots) setError(m.product_option_fields_max_images({ max }));
    const picked = files.slice(0, slots);
    if (!picked.length) return;
    setUploading(true);
    const added: string[] = [];
    // 한 장씩 — 연타 한도(429)를 피하고 순서를 지킨다
    for (const file of picked) {
      const check = checkInputImage(file);
      if (check !== "OK") {
        setError(IMAGE_FAILURE[check]());
        continue;
      }
      const ticket = await createInputImageUpload({
        data: { filename: file.name, size: file.size },
      }).catch(() => ({ failure: "UNKNOWN" as const }));
      if ("failure" in ticket) {
        setError(IMAGE_FAILURE[ticket.failure]());
        if (ticket.failure === "TOO_MANY_REQUESTS") break;
        continue;
      }
      const put = await fetch(ticket.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      }).catch(() => null);
      if (!put?.ok) {
        setError(m.product_option_fields_image_failed());
        continue;
      }
      added.push(ticket.url);
    }
    onChange([...urls, ...added]);
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <ul className="flex flex-wrap gap-2">
        {urls.map((src, index) => (
          <li key={src} className="relative size-20 bg-chip">
            <img
              src={src}
              alt={m.product_option_fields_image_alt({ label, index: index + 1 })}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              aria-label={m.product_option_fields_image_remove({ index: index + 1 })}
              disabled={disabled}
              onClick={() => onChange(urls.filter((_, at) => at !== index))}
              className="absolute top-0 right-0 flex size-6 items-center justify-center bg-black/60 text-white text-xs"
            >
              ×
            </button>
          </li>
        ))}
        {slots > 0 ? (
          <li>
            <label
              htmlFor={id}
              className={`flex size-20 cursor-pointer items-center justify-center border border-line-strong border-dashed text-caption text-muted hover:border-ink hover:text-ink ${uploading || disabled ? "opacity-50" : ""}`}
            >
              {m.product_option_fields_image_add()}
            </label>
            <input
              id={id}
              type="file"
              accept={INPUT_IMAGE_ACCEPT}
              multiple={slots > 1}
              disabled={uploading || disabled}
              aria-label={label}
              aria-describedby={describedBy}
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
          {m.product_option_fields_image_uploading()}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-caption text-point">
          {error}
        </p>
      ) : null}
    </div>
  );
}
