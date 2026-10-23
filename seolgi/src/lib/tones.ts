import type { CategoryNode } from "@sayren/storefront-sdk";

/** 사진 없는 상품 타일의 면 색 — 대분류 순서대로 고정한다(무작위로 바꾸지 않는다) */
const TONES = ["bg-tone-walk", "bg-tone-tag", "bg-tone-toy", "bg-tone-living"] as const;
export type Tone = (typeof TONES)[number] | "bg-tone-plain" | "bg-tone-cream";

/** 카테고리 id → 그 대분류의 면 색. 모르는 카테고리면 기본 면 */
export function toneOf(categoryId: string | null | undefined, tree: CategoryNode[]): Tone {
  if (!categoryId) return "bg-tone-plain";
  const index = tree.findIndex(
    (top) => top.categoryId === categoryId || containsCategory(top, categoryId),
  );
  return index < 0 ? "bg-tone-plain" : (TONES[index % TONES.length] ?? "bg-tone-plain");
}

function containsCategory(node: CategoryNode, categoryId: string): boolean {
  return node.children.some((c) => c.categoryId === categoryId || containsCategory(c, categoryId));
}

/** 카테고리 id로 이름 경로를 찾는다(타일의 작은 라벨) */
export function categoryName(
  categoryId: string | null | undefined,
  tree: CategoryNode[],
): string | null {
  if (!categoryId) return null;
  for (const node of tree) {
    if (node.categoryId === categoryId) return node.name;
    const inner = categoryName(categoryId, node.children);
    if (inner) return inner;
  }
  return null;
}
