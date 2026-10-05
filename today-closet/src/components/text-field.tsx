import { useId } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { inputClass } from "./ui/button";

/**
 * react-hook-form 입력 한 칸 — 라벨·필수 표시·안내·검증 오류를 함께 그린다.
 *
 * - 이름은 라벨 글자 그대로다(`aria-label`, 필수 표시·안내 문구는 빼고). 안내와 오류는 aria-describedby로 잇는다.
 * - 프리필은 `defaultValue`로 준다. `register`는 값을 서버 HTML에 싣지 않는다.
 * - 브라우저 필수 검사(`required`)를 그대로 둔다. 빈 칸은 브라우저가 먼저 막고, 형식은 zod 스키마가 안내한다.
 * - `row`면 데스크톱에서 라벨 120px | 입력 두 열이다(주문서 폼 행). 모바일은 늘 위아래다.
 */
export function TextField({
  label,
  registration,
  error,
  type = "text",
  defaultValue,
  autoComplete,
  placeholder,
  required,
  hint,
  row = false,
  inputMode,
  maxLength,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  type?: string;
  defaultValue?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  row?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}) {
  const hintId = useId();
  const errorId = useId();
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");
  return (
    <label
      className={
        row
          ? "grid min-w-0 gap-2 md:grid-cols-[120px_minmax(0,1fr)] md:gap-4"
          : "flex min-w-0 flex-col gap-2"
      }
    >
      <span className={`font-medium text-meta ${row ? "md:pt-3 md:text-body" : ""}`}>
        {label}
        {/* 필수 표시는 눈으로만 본다 — 입력의 required가 보조 기술에 필수임을 알린다 */}
        {required ? (
          <span aria-hidden="true" className="text-point">
            {" "}
            *
          </span>
        ) : null}
      </span>
      <span className="flex min-w-0 flex-col gap-1.5">
        <input
          {...registration}
          type={type}
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          inputMode={inputMode}
          maxLength={maxLength}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={inputClass({ invalid: Boolean(error) })}
        />
        {hint ? (
          <span id={hintId} className="block text-caption text-muted">
            {hint}
          </span>
        ) : null}
        {error ? (
          <span id={errorId} className="block text-caption text-point">
            {error}
          </span>
        ) : null}
      </span>
    </label>
  );
}
