import { Link, type LinkProps } from "@tanstack/react-router";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/** 버튼 모양 — primary(네이비 면·흰 글자) · secondary(테두리) · text(링크형). 높이 48px */
export type ButtonVariant = "primary" | "secondary" | "text";

const BASE =
  "inline-flex min-h-12 items-center justify-center gap-2 px-5 text-body font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-point disabled:cursor-not-allowed disabled:opacity-40";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-point text-point-ink hover:opacity-90",
  secondary: "border border-line-strong bg-page text-ink hover:border-ink",
  text: "min-h-11 px-0 text-sub underline underline-offset-4 hover:text-ink",
};

export function buttonClass(variant: ButtonVariant = "primary", extra = ""): string {
  return `${BASE} ${VARIANTS[variant]} ${extra}`.trim();
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  children,
  ...props
}: LinkProps & { variant?: ButtonVariant; className?: string; children: ReactNode }) {
  return (
    <Link className={buttonClass(variant, className)} {...props}>
      {children}
    </Link>
  );
}
