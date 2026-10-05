import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { m } from "../../i18n";
import type { SectionOf } from "../layout-schema";
import { SectionProductCard, SectionShell, useListView } from "./common";
import type { SectionData } from "./data";

/**
 * 상품 가로 한 줄 — scroll: 손가락으로 민다 · carousel: 이전·다음 버튼을 더한다.
 * 모바일은 두 장 반이 보이고 줄만 가로로 넘친다(페이지는 넘치지 않는다), 데스크톱은 네 장이 한 화면이다.
 */
export function ProductRailSection({
  section,
  data,
}: {
  section: SectionOf<"productRail">;
  data: SectionData<"productRail">;
}) {
  useListView(section.id, data.products);
  const track = useRef<HTMLDivElement>(null);
  const move = (direction: 1 | -1) =>
    track.current?.scrollBy({
      left: direction * track.current.clientWidth * 0.8,
      behavior: "smooth",
    });
  const control =
    "flex size-9 items-center justify-center border border-line-strong bg-page hover:border-ink";

  return (
    <SectionShell title={section.title} more={section.moreLink ? data.more : null}>
      <div className="relative min-w-0">
        <div
          ref={track}
          className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:gap-5 md:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {data.products.map((product) => (
            <div
              key={product.productId}
              className="w-[38%] shrink-0 snap-start md:w-[calc((100%-3.75rem)/4)]"
            >
              <SectionProductCard product={product} />
            </div>
          ))}
        </div>
        {section.variant === "carousel" && data.products.length > 2 ? (
          <div className="mt-4 flex justify-end gap-1">
            <button
              type="button"
              aria-label={m.product_rail_prev()}
              onClick={() => move(-1)}
              className={control}
            >
              <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={1.6} />
            </button>
            <button
              type="button"
              aria-label={m.product_rail_next()}
              onClick={() => move(1)}
              className={control}
            >
              <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.6} />
            </button>
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}
