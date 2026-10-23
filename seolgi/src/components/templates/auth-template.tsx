import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BrandMark } from "../atoms/brand-mark";

/** 로그인·가입 틀 (시안 DLogin) — 400px 가운데 칸, 위에 큰 심볼과 워드마크. 헤더·푸터 없음 */
export function AuthTemplate({
  title,
  showTitle = false,
  children,
}: {
  title: string;
  /** 제목을 화면에 보인다(가입처럼 로고만으로는 화면을 알 수 없을 때) */
  showTitle?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-[400px] flex-col gap-9 px-2 pt-16 pb-24 md:pt-24">
      <Link
        to="/"
        aria-label="설기로운 홈"
        className="flex flex-col items-center gap-2.5 self-center"
      >
        <BrandMark className="h-16 w-auto text-brand" />
        <span className="font-display text-wordmark text-ink leading-none">설기로운</span>
      </Link>
      <h1 className={showTitle ? "text-center font-display text-h2" : "sr-only"}>{title}</h1>
      {children}
    </div>
  );
}

/** 「이메일로 로그인」 같은 가운데 글이 있는 구분선 */
export function DividerText({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-caption text-muted">
      <span className="h-px flex-1 bg-line" />
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
