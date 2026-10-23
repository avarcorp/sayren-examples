import type { InputHTMLAttributes, ReactNode } from "react";

/** 체크박스 + 글자 — 상자 색은 primary, 누르는 영역은 44px 높이 */
export function Checkbox({
  children,
  className = "",
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { children?: ReactNode }) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-center gap-2.5 ${className}`}>
      <input type="checkbox" className="size-[18px] shrink-0 accent-primary" {...rest} />
      {children}
    </label>
  );
}
