import type { CategoryNode } from "@sayren/storefront-sdk";
import type { NavLink } from "../components/site-header";
import type { HeaderLayout } from "./layout-schema";

function flatten(nodes: readonly CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

/**
 * 헤더 메뉴를 링크로 — 경로 메뉴는 그대로, 카테고리 이름 메뉴는 그 카테고리의 목록 경로로 바꾼다.
 * 이름이 맞는 카테고리가 없으면 그 메뉴만 뺀다. 카테고리 메뉴가 없으면 카테고리를 받지 않는다.
 */
export async function resolveNav(
  items: HeaderLayout["nav"],
  listCategories: () => Promise<CategoryNode[]>,
): Promise<NavLink[]> {
  const needsCategories = items.some((item) => "category" in item);
  const categories = needsCategories ? flatten(await listCategories().catch(() => [])) : [];
  return items.flatMap((item): NavLink[] => {
    if ("to" in item) return [{ label: item.label, to: item.to }];
    const found = categories.find((node) => node.name === item.category);
    return found
      ? [{ label: item.label, to: `/products?categoryId=${encodeURIComponent(found.categoryId)}` }]
      : [];
  });
}

/**
 * 지금 화면이 이 메뉴인가 — 경로가 같고 메뉴 주소의 검색 파라미터가 모두 같으면 고른 메뉴다.
 * 카테고리 없는 메뉴(신상품·베스트)는 카테고리를 고른 목록에서 켜지 않는다.
 */
export function isNavActive(
  to: string,
  location: { pathname: string; search: Record<string, unknown> },
): boolean {
  const [path = "/", query = ""] = to.split("#")[0]?.split("?") ?? [];
  if (path !== location.pathname) return false;
  const params = new URLSearchParams(query);
  if (!params.has("categoryId") && location.search.categoryId != null) return false;
  for (const [key, value] of params) {
    if (String(location.search[key] ?? "") !== value) return false;
  }
  return true;
}
