import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { m } from "../../i18n";
import { type MyPageKey, MyPageSideNav } from "../my-page-nav";
import { PageTitle } from "../ui/section";

/** 하위 화면에서 돌아갈 곳 — 접근성 이름은 돌아갈 화면 이름이다 */
export type MyPageBack =
  | { to: "/orders"; label: string }
  | { to: "/account/reviews"; label: string }
  | { to: "/account/support"; label: string };

/**
 * 마이페이지 셸 — 데스크톱(lg 이상)은 왼쪽 200px 메뉴 + 오른쪽 본문, 모바일은 페이지 제목 + 뒤로 링크만 둔다.
 * 모바일 하위 화면에는 탭을 두지 않는다(마이페이지 홈의 메뉴 목록에서 들어간다). 폭은 루트 `main`의 `max-w-page`를 따른다.
 *
 * - `back`이 없으면 모바일 뒤로는 마이페이지 홈이고 데스크톱에는 없다(왼쪽 메뉴가 있다)
 * - `back`이 있으면(주문 상세 등) 데스크톱에도 뒤로 링크를 둔다
 */
export function MyPageShell({
  current,
  title,
  description,
  action,
  back,
  children,
}: {
  current: MyPageKey;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  back?: MyPageBack;
  children: ReactNode;
}) {
  const home = current === "home";
  const backClass = `-ml-2.5 flex size-10 shrink-0 items-center justify-center text-ink ${back ? "" : "lg:hidden"}`;
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-14 lg:pt-4 lg:pb-12">
      <MyPageSideNav current={current} />
      <div className="flex min-w-0 flex-col gap-6 lg:gap-10">
        <div className={`flex min-w-0 items-center gap-1 ${home ? "lg:sr-only" : ""}`}>
          {home ? null : back ? (
            <Link to={back.to} aria-label={back.label} className={backClass}>
              <ChevronLeft aria-hidden="true" className="size-6" />
            </Link>
          ) : (
            <Link to="/account" aria-label={m.mypage_back()} className={backClass}>
              <ChevronLeft aria-hidden="true" className="size-6" />
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <PageTitle description={description} action={action}>
              {title}
            </PageTitle>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
