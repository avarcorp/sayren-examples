import type { ReactNode } from "react";

/** 입력 한 칸 — 라벨, 칸, 안내 또는 오류. 오류는 칸의 `aria-describedby`로 잇는다(`${id}-msg`) */
export function FormField({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="font-medium text-small">
        {label}
        {required ? null : <span className="ml-1.5 font-normal text-muted">선택</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="text-primary text-small">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-muted text-small">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** 칸에 붙일 접근성 속성 */
export function fieldAria(id: string, error?: string, hint?: unknown) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error || hint ? `${id}-msg` : undefined,
  } as const;
}
