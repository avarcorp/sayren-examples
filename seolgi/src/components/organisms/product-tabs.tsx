import { useEffect, useState } from "react";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

/** 상세 탭 바 — 위에 붙어 따라오고, 지금 보이는 구역에 primary 밑줄을 둔다 */
export function ProductTabs({ tabs }: { tabs: TabItem[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  useEffect(() => {
    const sections = tabs
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        const first = visible.sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
        )[0];
        if (first) setActive(first.target.id);
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );
    for (const s of sections) observer.observe(s);
    return () => observer.disconnect();
  }, [tabs]);
  return (
    <nav
      aria-label="상품 정보"
      className="sticky top-0 z-10 -mx-4 overflow-x-auto border-line border-b bg-page px-4 md:mx-0 md:px-0"
    >
      <ul className="flex gap-8 text-lead">
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                aria-current={on ? "true" : undefined}
                className={`-mb-px block whitespace-nowrap border-b-2 py-4 ${on ? "border-primary font-medium" : "border-transparent text-muted hover:text-ink"}`}
              >
                {t.label}
                {t.count ? <span className="ml-1 text-muted">{t.count}</span> : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
