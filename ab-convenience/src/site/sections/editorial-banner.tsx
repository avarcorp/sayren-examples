import { ChevronRight } from "lucide-react";
import type { SectionOf } from "../layout-schema";
import { fill, SiteLink } from "../site-link";

const ASPECT = {
  wide: "aspect-[16/9] md:aspect-[21/9]",
  twoUp: "aspect-[4/3] md:aspect-[3/2]",
  threeUp: "aspect-[4/3] md:aspect-[4/5]",
} as const;

const COLUMNS = {
  wide: "grid-cols-1",
  twoUp: "md:grid-cols-2",
  threeUp: "md:grid-cols-3",
} as const;

/** 이미지 배너 — wide: 한 장 · twoUp·threeUp: 나란히 두세 장. 제목·설명은 이미지 아래 */
export function EditorialBannerSection({
  section,
  storeName,
}: {
  section: SectionOf<"editorialBanner">;
  storeName: string;
}) {
  return (
    <div className={`grid gap-x-5 gap-y-7 ${COLUMNS[section.variant]}`}>
      {section.items.map((item, index) => {
        const body = (
          <>
            <span className="block overflow-hidden bg-chip">
              <img
                src={item.image}
                alt={item.imageAlt ?? ""}
                loading="lazy"
                className={`w-full object-cover transition duration-500 group-hover:scale-[1.03] ${ASPECT[section.variant]}`}
              />
            </span>
            <span className="mt-3 flex min-w-0 items-center gap-1 font-bold font-display text-body-lg md:text-lg">
              <span className="min-w-0 break-words">{fill(item.title, storeName)}</span>
              {item.to ? (
                <ChevronRight aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.6} />
              ) : null}
            </span>
            {item.subtitle ? (
              <span className="mt-0.5 block text-body text-sub">
                {fill(item.subtitle, storeName)}
              </span>
            ) : null}
          </>
        );
        const key = `${item.image}-${index}`;
        return item.to ? (
          <SiteLink key={key} to={item.to} className="group block min-w-0">
            {body}
          </SiteLink>
        ) : (
          <div key={key} className="min-w-0">
            {body}
          </div>
        );
      })}
    </div>
  );
}
