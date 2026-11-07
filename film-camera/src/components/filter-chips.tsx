import { Link, type LinkProps } from "@tanstack/react-router";

const CHIP =
  "inline-flex min-h-11 shrink-0 items-center border px-4 text-body whitespace-nowrap focus-visible:outline-2 focus-visible:outline-point";

/** 필터 칩 — 선택은 잉크 테두리 + 굵게. 링크라 URL이 상태다 */
export function FilterChips({
  label,
  chips,
}: {
  label: string;
  chips: { key: string; label: string; active: boolean; link: LinkProps }[];
}) {
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-2">
        {chips.map((chip) => (
          <li key={chip.key}>
            <Link
              {...chip.link}
              aria-current={chip.active ? "true" : undefined}
              className={`${CHIP} ${chip.active ? "border-ink font-bold" : "border-line text-sub hover:border-ink"}`}
            >
              {chip.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
