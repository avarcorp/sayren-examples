import { Link } from "@tanstack/react-router";
import { chipClass } from "../../components/browse/chips";
import type { SectionOf } from "../layout-schema";
import { SectionShell } from "./common";
import type { SectionData } from "./data";

/** 카테고리 바로가기 — chips: 이름 칩 · tiles: 사각 이미지 · circles: 원형 이미지 */
export function CategoryGridSection({
  section,
  data,
}: {
  section: SectionOf<"categoryGrid">;
  data: SectionData<"categoryGrid">;
}) {
  const { categories } = data;
  if (section.variant === "chips") {
    const chips = (
      <nav className="flex flex-wrap gap-1.5 md:gap-2" aria-label={section.title}>
        {categories.map((category) => (
          <Link
            key={category.categoryId}
            to="/products"
            search={{ categoryId: category.categoryId }}
            className={chipClass(false)}
          >
            {category.name}
          </Link>
        ))}
      </nav>
    );
    return section.title ? <SectionShell title={section.title}>{chips}</SectionShell> : chips;
  }

  const circles = section.variant === "circles";
  return (
    <SectionShell title={section.title}>
      <nav
        aria-label={section.title}
        className={
          circles
            ? "grid grid-cols-4 gap-x-3 gap-y-5 md:grid-cols-8 md:gap-x-6"
            : "grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-5"
        }
      >
        {categories.map((category) => (
          <Link
            key={category.categoryId}
            to="/products"
            search={{ categoryId: category.categoryId }}
            className="group flex min-w-0 flex-col items-center gap-2 text-center text-meta md:text-body"
          >
            <span
              className={`block w-full overflow-hidden bg-chip ${
                circles ? "aspect-square rounded-full" : "aspect-[4/3]"
              }`}
            >
              {category.image ? (
                <img
                  src={category.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              ) : null}
            </span>
            <span className="w-full truncate">{category.name}</span>
          </Link>
        ))}
      </nav>
    </SectionShell>
  );
}
