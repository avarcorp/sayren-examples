import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

const CONTROL =
  "min-h-12 w-full border border-line-strong bg-page px-3 text-body text-ink placeholder:text-muted focus:border-point focus:outline-none";

/** 라벨이 붙은 입력 칸. 오류는 칸 아래 한 줄 */
export const TextField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }
>(function TextField({ label, error, hint, id, className = "", ...props }, ref) {
  const inputId = id ?? props.name;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-meta text-sub">
        {label}
        {props.required ? <span className="ml-0.5 text-sale">*</span> : null}
      </label>
      <input ref={ref} id={inputId} className={CONTROL} aria-invalid={Boolean(error)} {...props} />
      {error ? (
        <p className="text-caption text-sale">{error}</p>
      ) : hint ? (
        <p className="text-caption text-muted">{hint}</p>
      ) : null}
    </div>
  );
});

export function SelectField({
  label,
  children,
  id,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  const selectId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-meta text-sub">
        {label}
      </label>
      <select id={selectId} className={CONTROL} {...props}>
        {children}
      </select>
    </div>
  );
}

export function Checkbox({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-body">
      <input type="checkbox" className="size-5 shrink-0 accent-point" {...props} />
      <span className="min-w-0">{label}</span>
    </label>
  );
}
