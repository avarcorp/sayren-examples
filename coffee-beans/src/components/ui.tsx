import { Link, type LinkProps } from "@tanstack/react-router";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

/** 공통 부품 — docs/04-design-system.md §3. 바탕은 흰색, 대표 색은 버튼·글자·테두리에만 쓴다 */

export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}

/** 페이지 머리 — 제목 한 줄뿐이다(설명 줄 자리 없음) */
export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="break-words font-bold text-xl leading-snug">{children}</h1>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-bold text-lg">{children}</h2>;
}

type Variant = "primary" | "secondary" | "text";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-point text-white hover:bg-point-hover disabled:border disabled:border-line disabled:bg-page disabled:text-muted",
  secondary: "border border-line-strong bg-page text-ink hover:border-point disabled:text-muted",
  text: "text-point underline-offset-4 hover:underline",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "md" | "sm" }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-control px-4 font-semibold text-body transition-colors disabled:cursor-not-allowed",
        size === "md" ? "min-h-12" : "min-h-10 text-meta",
        VARIANTS[variant],
        className,
      )}
    />
  );
}

export function LinkButton({
  variant = "primary",
  className,
  ...props
}: LinkProps & { variant?: Variant; className?: string; children: ReactNode }) {
  return (
    <Link
      {...props}
      className={cx(
        "inline-flex min-h-12 items-center justify-center rounded-control px-4 font-semibold text-body",
        VARIANTS[variant],
        className,
      )}
    />
  );
}

/** 옵션·필터 칩 — 선택하면 대표 색 테두리 2px와 글자 */
export function Chip({
  selected,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      {...props}
      className={cx(
        "inline-flex min-h-10 shrink-0 items-center justify-center rounded-control border bg-page px-3 text-body disabled:cursor-not-allowed disabled:text-muted disabled:line-through",
        selected ? "border-2 border-point font-semibold text-point" : "border-line-strong text-ink",
        className,
      )}
    />
  );
}

/** 배지 — 흰 바탕, 글자·테두리만 */
export function Badge({
  tone = "point",
  children,
}: {
  tone?: "point" | "sale" | "muted";
  children: ReactNode;
}) {
  const color =
    tone === "sale"
      ? "border-sale text-sale"
      : tone === "muted"
        ? "border-line-strong text-muted"
        : "border-point text-point";
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-[4px] border px-1.5 py-0.5 text-caption font-semibold",
        color,
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: 입력은 children으로 들어온다
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="font-semibold text-meta">{label}</span>
      {children}
      {hint ? <span className="text-caption text-muted">{hint}</span> : null}
      {error ? <span className="text-caption text-sale">{error}</span> : null}
    </label>
  );
}

const INPUT =
  "min-h-12 min-w-0 rounded-control border border-line-strong bg-page px-3 text-body-lg outline-none focus:border-point";

/** 폭 클래스(w-*)를 주면 기본 w-full을 빼서 두 폭이 겹치지 않게 한다 */
const width = (className?: string) => (/(^|\s)w-/.test(className ?? "") ? null : "w-full");

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(INPUT, width(props.className), props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(INPUT, "min-h-28 py-3", width(props.className), props.className)}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cx(INPUT, "pr-8", width(props.className), props.className)} />
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-sub">{message}</p>
      {action}
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-meta text-sale">
      {children}
    </p>
  );
}

export function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const full = Math.round(rating);
  return (
    <span
      aria-hidden
      className={cx("tracking-tight text-point", size === "sm" ? "text-meta" : "text-body-lg")}
    >
      {"★".repeat(full)}
      <span className="text-line-strong">{"★".repeat(5 - full)}</span>
    </span>
  );
}

/** 본문 폭 — 헤더와 같은 폭, 16px 좌우 여백 */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("mx-auto w-full max-w-page px-4 md:px-6", className)}>{children}</div>;
}
