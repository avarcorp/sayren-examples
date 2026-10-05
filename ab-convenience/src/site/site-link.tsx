import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { StoreBrand } from "../components/site-header";
import { m } from "../i18n";

/**
 * 설정의 사이트 안 경로(`/products?categoryId=…` 같은 값)를 라우터 링크로 그린다. 경로 검사는 스키마가 이미 했다
 * (`isInternalPath`) — 외부 주소는 설정에 들어올 수 없다.
 */
export function SiteLink({
  to,
  className,
  children,
}: {
  to: string;
  className?: string;
  children: ReactNode;
}) {
  const [pathname = "/", query = ""] = to.split("#")[0]?.split("?") ?? [];
  const search = Object.fromEntries(new URLSearchParams(query));
  return (
    <Link to={pathname as "/"} search={search as never} className={className}>
      {children}
    </Link>
  );
}

/** 설정 문구의 `{storeName}`을 상점 이름으로 바꾼다. 그 밖의 치환은 없다 */
export function fill(text: string, storeName: string): string {
  return text.replaceAll("{storeName}", storeName);
}

/** 루트 loader가 한 번 읽은 상점 이름·로고(`__root.tsx`) — 섹션이 문구 치환에 쓴다 */
export function useStoreBrand(): StoreBrand | null {
  return useRouterState({
    select: (state) =>
      (state.matches[0]?.loaderData as { store?: StoreBrand | null } | undefined)?.store ?? null,
  });
}

export function useStoreName(): string {
  return useStoreBrand()?.name ?? m.site_store_fallback();
}
