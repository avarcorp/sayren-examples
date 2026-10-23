import type { ButtonHTMLAttributes } from "react";

/**
 * 버튼 모양 — 주 버튼(primary 면), 보조(잉크 테두리), 옅은 테두리, 글자 링크.
 * 링크(`<Link>`)도 같은 모양을 쓰도록 클래스 함수로 둔다. 모서리는 각지게 둔다.
 */
const VARIANTS = {
  primary: "bg-primary text-white hover:bg-primary-strong",
  outline: "border border-ink bg-page hover:bg-ink hover:text-white",
  subtle: "border border-line-strong bg-page hover:border-ink",
  text: "px-0 underline underline-offset-4 hover:text-muted",
} as const;

const SIZES = {
  sm: "h-11 px-4 text-body",
  md: "h-13 px-7 text-body",
  lg: "h-14 px-6 text-lead",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export function buttonClass({
  variant = "primary",
  size = "md",
  block = false,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
} = {}) {
  return `inline-flex shrink-0 items-center justify-center gap-2 font-medium disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${variant === "text" ? "h-auto py-2" : SIZES[size]} ${block ? "w-full" : ""}`;
}

export function Button({
  variant,
  size,
  block,
  className = "",
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}) {
  return (
    <button
      type={type}
      className={`${buttonClass({ variant, size, block })} ${className}`}
      {...rest}
    />
  );
}
