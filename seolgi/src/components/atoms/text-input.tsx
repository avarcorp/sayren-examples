import { forwardRef, type InputHTMLAttributes } from "react";

/** 밑줄 입력칸 모양 — 주문서·로그인·마이페이지가 같이 쓴다 */
export const inputClass =
  "h-12 w-full min-w-0 border-0 border-ink border-b bg-transparent text-body outline-none placeholder:text-muted aria-invalid:border-primary disabled:text-muted";

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = "", ...rest }, ref) {
    return <input ref={ref} className={`${inputClass} ${className}`} {...rest} />;
  },
);
