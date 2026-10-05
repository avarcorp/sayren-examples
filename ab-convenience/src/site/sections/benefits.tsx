import type { SectionOf } from "../layout-schema";
import { fill } from "../site-link";

/** 짧은 혜택 항목 4개까지 — band: 옅은 면 띠(칸 사이 선) · grid: 테두리 칸 */
export function BenefitsSection({
  section,
  storeName,
}: {
  section: SectionOf<"benefits">;
  storeName: string;
}) {
  if (section.variant === "band") {
    return (
      <ul className="grid divide-y divide-line bg-chip px-4 md:auto-cols-fr md:grid-flow-col md:divide-x md:divide-y-0 md:px-0 md:py-5">
        {section.items.map((item, index) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: 항목은 순서가 곧 정체다
            key={index}
            className="flex min-w-0 items-baseline justify-between gap-3 py-3 md:flex-col md:items-center md:justify-center md:gap-1 md:px-6 md:py-0 md:text-center"
          >
            <p className="shrink-0 font-bold text-body">{fill(item.title, storeName)}</p>
            {item.description ? (
              <p className="min-w-0 text-right text-caption text-sub md:text-center md:text-meta">
                {fill(item.description, storeName)}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="grid gap-2.5 md:grid-cols-2 md:gap-4">
      {section.items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 항목은 순서가 곧 정체다
        <li key={index} className="flex min-w-0 flex-col gap-1 border border-line p-4 md:p-5">
          <p className="font-bold text-body-lg">{fill(item.title, storeName)}</p>
          {item.description ? (
            <p className="text-body text-sub">{fill(item.description, storeName)}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
