import { Link } from "@tanstack/react-router";

/** 위치 줄 — 홈 / 대분류 / 하위. 마지막은 지금 위치 */
export function Breadcrumb({ path }: { path: { categoryId: string; name: string }[] }) {
  return (
    <nav aria-label="위치" className="pb-5 text-caption text-muted">
      <ol className="flex flex-wrap gap-1.5">
        <li>
          <Link to="/" className="hover:text-ink">
            홈
          </Link>
        </li>
        {path.map((c, i) => (
          <li key={c.categoryId} className="flex gap-1.5">
            <span aria-hidden>/</span>
            <Link
              to="/products"
              search={{ categoryId: c.categoryId }}
              aria-current={i === path.length - 1 ? "page" : undefined}
              className="hover:text-ink"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
