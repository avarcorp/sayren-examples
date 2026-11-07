import { Link, type LinkProps } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";
import { m } from "../i18n";
import { formatDate, formatDateTime } from "../lib/dates";

/** 공용 부품 — 버튼·입력·제목·빈 상태. 색·모서리는 theme.css 토큰만 쓴다(docs/04-design-system.md) */

type Variant = "primary" | "secondary";

const BUTTON_BASE =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-control px-5 font-semibold text-body-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-point disabled:cursor-not-allowed lg:min-h-11";

const BUTTON_VARIANT: Record<Variant, string> = {
  primary:
    "bg-point-strong text-white hover:bg-ink disabled:border disabled:border-line-strong disabled:bg-page disabled:text-muted",
  secondary:
    "border border-line-strong bg-page text-ink hover:border-ink disabled:text-muted disabled:hover:border-line-strong",
};

export function buttonClass(variant: Variant = "primary", extra = ""): string {
  return `${BUTTON_BASE} ${BUTTON_VARIANT[variant]} ${extra}`;
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: LinkProps & { variant?: Variant; className?: string; children: ReactNode }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

/** 페이지 머리 — 제목만 둔다(설명 줄 없음) */
export function PageHeader({ title }: { title: string }) {
  return (
    <header className="border-ink border-b pb-3">
      <h1 className="font-bold text-xl tracking-tight">{title}</h1>
    </header>
  );
}

export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="font-bold text-lg tracking-tight">
      {children}
    </h2>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 border-line border-y py-10">
      <p className="text-body-lg text-sub">{message}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 border-danger border-l-2 py-2 pl-4"
    >
      <p className="text-body-lg text-danger">{message}</p>
      {action}
    </div>
  );
}

const FIELD_INPUT =
  "min-h-12 w-full min-w-0 rounded-control border border-line-strong bg-page px-3 text-body-lg text-ink placeholder:text-muted focus:border-ink focus:outline-2 focus:outline-offset-0 focus:outline-point";

interface FieldShellProps {
  id: string;
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  children: ReactNode;
}

export function FieldShell({ id, label, required, help, error, children }: FieldShellProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold text-meta">
        {label}
        {required ? <span className="sr-only"> ({m.field_required()})</span> : null}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-point-strong">
            *
          </span>
        ) : null}
      </label>
      {children}
      {help && !error ? <p className="text-caption text-muted">{help}</p> : null}
      {error ? <p className="text-caption text-danger">{error}</p> : null}
    </div>
  );
}

type FieldProps<T extends "input" | "textarea" | "select"> = ComponentProps<T> & {
  id: string;
  label: string;
  help?: string;
  error?: string;
};

export function TextField({ id, label, help, error, required, ...props }: FieldProps<"input">) {
  return (
    <FieldShell id={id} label={label} required={required} help={help} error={error}>
      <input id={id} required={required} className={FIELD_INPUT} {...props} />
    </FieldShell>
  );
}

export function TextArea({ id, label, help, error, required, ...props }: FieldProps<"textarea">) {
  return (
    <FieldShell id={id} label={label} required={required} help={help} error={error}>
      <textarea
        id={id}
        required={required}
        rows={4}
        className={`${FIELD_INPUT} py-3 leading-relaxed`}
        {...props}
      />
    </FieldShell>
  );
}

export function Select({ id, label, help, error, required, ...props }: FieldProps<"select">) {
  return (
    <FieldShell id={id} label={label} required={required} help={help} error={error}>
      <select id={id} required={required} className={FIELD_INPUT} {...props} />
    </FieldShell>
  );
}

export function Checkbox({ label, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-body-lg">
      <input type="checkbox" className="size-5 shrink-0 accent-point-strong" {...props} />
      <span className="min-w-0">{label}</span>
    </label>
  );
}

/** 서버 시각을 브라우저 시간대로 보인다. 서버 렌더와 시간대가 달라도 하이드레이션 경고를 내지 않는다 */
export function DateText({ iso, withTime = false }: { iso: string; withTime?: boolean }) {
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {withTime ? formatDateTime(iso) : formatDate(iso)}
    </time>
  );
}

/** 2열 정의 표 — 금액·배송지·고시처럼 라벨과 값이 짝인 정보 */
export function InfoRows({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-line border-line border-y">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[7.5rem_1fr] gap-3 py-3 text-body">
          <dt className="text-sub">{row.label}</dt>
          <dd className="min-w-0 break-words">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
