import type { CategoryNode } from "@sayren/storefront-sdk";
import { toneOf } from "../../lib/tones";
import { CategoryCircle } from "../molecules/category-circle";

/** 대분류 바로가기 원 줄 — 기획전이 있으면 끝에 「기획전」을 더한다 */
export function CategoryShortcuts({
  tree,
  showCollections,
}: {
  tree: CategoryNode[];
  showCollections: boolean;
}) {
  if (tree.length === 0) return null;
  return (
    <nav
      aria-label="카테고리 바로가기"
      className="grid grid-cols-4 gap-x-3 gap-y-6 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] md:gap-6"
    >
      {tree.map((c) => (
        <CategoryCircle
          key={c.categoryId}
          name={c.name}
          tone={toneOf(c.categoryId, tree)}
          link={{ to: "/products", search: { categoryId: c.categoryId } }}
        />
      ))}
      {showCollections ? (
        <CategoryCircle name="기획전" tone="bg-tone-cream" link={{ to: "/collections" }} />
      ) : null}
    </nav>
  );
}
