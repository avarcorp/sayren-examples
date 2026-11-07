import { m } from "../../i18n";

/** 고정 탭 바 — 같은 화면의 구획으로 이동한다. 헤더 아래에 붙는다 */
export function ProductTabs({
  reviewCount,
  inquiryCount,
}: {
  reviewCount: number;
  inquiryCount: number;
}) {
  const tabs = [
    { href: "#detail", label: m.product_tab_detail() },
    { href: "#reviews", label: m.product_tab_reviews({ count: reviewCount }) },
    { href: "#inquiries", label: m.product_tab_inquiries({ count: inquiryCount }) },
    { href: "#seller", label: m.product_tab_seller() },
  ];
  return (
    <nav
      aria-label={m.product_tab_detail()}
      className="sticky top-[93px] z-10 -mx-4 border-line border-b bg-page px-4 lg:top-[101px]"
    >
      <ul className="grid grid-cols-4">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <a
              href={tab.href}
              className="flex min-h-12 items-center justify-center whitespace-nowrap text-meta hover:text-point-strong sm:text-body"
            >
              {tab.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
