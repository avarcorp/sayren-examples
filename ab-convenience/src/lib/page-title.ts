import { m } from "../i18n";

/** 루트 라우트 loader가 내려 주는 상점 이름 — `__root.tsx`의 `RootData.store` */
function storeNameOf(matches: ReadonlyArray<{ loaderData?: unknown }>): string | null {
  const root = matches[0]?.loaderData as { store?: { name?: unknown } | null } | undefined;
  const name = root?.store?.name;
  return typeof name === "string" && name.trim() ? name : null;
}

/**
 * 탭 제목 — `{화면} | {상점 이름}`. 홈처럼 화면 이름이 없으면 상점 이름만 쓴다.
 * 라우트 `head`의 `matches`를 그대로 넘긴다(루트 loader가 상점 이름을 싣는다).
 *
 * 확장 지점 — 구분자나 순서를 바꾸려면 여기만 고친다.
 */
export function pageTitle(
  matches: ReadonlyArray<{ loaderData?: unknown }>,
  screen?: string | null,
): string {
  const store = storeNameOf(matches) ?? m.site_store_fallback();
  return screen ? `${screen} | ${store}` : store;
}
