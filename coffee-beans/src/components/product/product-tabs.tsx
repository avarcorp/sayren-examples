import { lazyMessages, m } from "../../i18n";

export type TabKey = "detail" | "reviews" | "inquiries" | "seller";

const LABELS = lazyMessages<TabKey>({
  detail: () => m.tab_detail(),
  reviews: () => m.tab_reviews(),
  inquiries: () => m.tab_inquiries(),
  seller: () => m.tab_seller(),
});

/** 고정 탭 바 — 각 구획으로 스크롤한다. 흰 바탕, 아래 선 */
export function ProductTabs({ counts }: { counts: { reviews: number; inquiries: number } }) {
  const keys: TabKey[] = ["detail", "reviews", "inquiries", "seller"];
  return (
    <nav className="sticky top-[93px] z-30 -mx-4 grid grid-cols-4 border-line border-b bg-page md:mx-0">
      {keys.map((key) => (
        <a
          key={key}
          href={`#${key}`}
          className="grid min-h-12 place-items-center px-1 text-center text-meta hover:text-point"
        >
          <span>
            {LABELS[key]}
            {key === "reviews" && counts.reviews > 0 ? (
              <span className="pl-0.5 text-muted tabular">{counts.reviews}</span>
            ) : null}
            {key === "inquiries" && counts.inquiries > 0 ? (
              <span className="pl-0.5 text-muted tabular">{counts.inquiries}</span>
            ) : null}
          </span>
        </a>
      ))}
    </nav>
  );
}
