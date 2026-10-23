import type { ReactNode } from "react";
import type { AccountSummary } from "../../lib/account";
import { AccountNav } from "../organisms/account-nav";

/** 마이페이지 틀 (시안 DOrder) — 왼쪽 메뉴, 오른쪽 본문 */
export function AccountTemplate({
  summary,
  onLogout,
  children,
}: {
  summary: AccountSummary;
  onLogout: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start gap-10 pt-12 pb-24 md:gap-16">
      <AccountNav summary={summary} onLogout={onLogout} />
      <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-12">{children}</div>
    </div>
  );
}

/** 마이페이지 화면 제목 — 36px Jua와 오른쪽 보조 글 */
export function AccountTitle({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h1 className="font-display text-page-title">{title}</h1>
      {aside ? <span className="text-muted text-small">{aside}</span> : null}
    </div>
  );
}
