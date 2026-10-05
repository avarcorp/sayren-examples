import { useEffect, useRef, useState } from "react";
import { m } from "../i18n";

export interface DetailTab {
  id: string;
  label: string;
}

/** 고정 헤더의 높이 — 탭 바·따라오는 구매 상자가 그 아래에 붙는다 */
export function useHeaderHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const update = () => setHeight(header.getBoundingClientRect().height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  return height;
}

/** 섹션으로 스크롤 — 고정 헤더와 탭 바 높이만큼 덜 내려간다 */
export function scrollToSection(id: string, offset: number) {
  const target = document.getElementById(id);
  if (!target) return;
  const top = target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
}

/**
 * 상세 탭 바 — 스크롤하면 헤더 아래에 붙고, 지금 보고 있는 섹션을 표시한다. 누르면 그 섹션으로 옮겨 간다.
 * 칸은 탭 수만큼 균등 분할이다. 데스크톱은 고른 탭이 잉크 테두리 상자, 모바일은 잉크 밑줄이다.
 * 링크(`#id`)라서 자바스크립트 없이도 이동한다.
 */
export function ProductDetailTabs({
  tabs,
  headerHeight,
}: {
  tabs: DetailTab[];
  headerHeight: number;
}) {
  const barRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  useEffect(() => {
    const onScroll = () => {
      const line = headerHeight + (barRef.current?.offsetHeight ?? 0) + 8;
      let current = tabs[0]?.id ?? "";
      for (const tab of tabs) {
        const section = document.getElementById(tab.id);
        if (section && section.getBoundingClientRect().top <= line) current = tab.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [tabs, headerHeight]);

  return (
    <nav
      ref={barRef}
      aria-label={m.pd_tabs_label()}
      style={{ top: headerHeight, gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      className="sticky z-20 -mx-4 grid border-line border-b bg-page md:mx-0 md:border-ink"
    >
      {tabs.map((tab, index) => {
        const current = active === tab.id;
        const next = tabs[index + 1];
        // 데스크톱: 고른 탭은 잉크 상자(아래 선을 덮는다), 나머지는 위·오른쪽 회색 선. 고른 탭 바로 왼쪽 칸은 오른쪽 선을 그리지 않는다
        const desktop = current
          ? "md:border-x md:border-t md:border-b-0 md:border-ink md:bg-page"
          : `md:border-b-0 md:border-line md:border-t ${next && active === next.id ? "" : "md:border-r"} ${index === 0 ? "md:border-l" : ""}`;
        return (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            aria-current={current ? "location" : undefined}
            onClick={(event) => {
              event.preventDefault();
              setActive(tab.id);
              scrollToSection(tab.id, headerHeight + (barRef.current?.offsetHeight ?? 0));
            }}
            className={`-mb-px flex min-w-0 items-center justify-center border-b-2 px-1 py-3.5 text-center text-meta md:py-4 md:text-body-lg ${
              current
                ? "border-ink font-bold text-ink"
                : "border-transparent text-muted hover:text-ink"
            } ${desktop}`}
          >
            <span className="truncate">{tab.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
