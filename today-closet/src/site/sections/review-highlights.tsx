import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { m } from "../../i18n";
import { productPathParam } from "../../lib/product-path";
import type { SectionOf } from "../layout-schema";
import { SectionShell } from "./common";
import type { SectionData } from "./data";

/** 실제 후기 모음 — 공개 후기만, 3개 미만이면 로더가 섹션을 숨긴다. cards: 테두리 카드 · quotes: 왼쪽 선 인용 */
export function ReviewHighlightsSection({
  section,
  data,
}: {
  section: SectionOf<"reviewHighlights">;
  data: SectionData<"reviewHighlights">;
}) {
  const quotes = section.variant === "quotes";
  return (
    <SectionShell title={section.title ?? m.review_highlights_title()}>
      <ul className={quotes ? "flex flex-col gap-6" : "grid gap-2.5 md:grid-cols-3 md:gap-5"}>
        {data.reviews.map((review) => (
          <li
            key={review.reviewId}
            className={
              quotes
                ? "flex min-w-0 flex-col gap-2 border-ink border-l-2 pl-4"
                : "flex min-w-0 flex-col gap-3 border border-line p-4 md:p-5"
            }
          >
            <div className="flex items-center gap-2">
              <span
                className="flex items-center gap-px text-ink"
                role="img"
                aria-label={m.review_highlights_meta({
                  rating: review.rating,
                  writer: review.writerMaskedName,
                })}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    aria-hidden="true"
                    className={`size-3.5 ${n <= review.rating ? "fill-ink" : "text-line-strong"}`}
                    strokeWidth={1.6}
                  />
                ))}
              </span>
              <span aria-hidden="true" className="text-caption text-muted">
                {review.writerMaskedName}
              </span>
            </div>
            <p className="line-clamp-4 whitespace-pre-line break-words text-body">
              {review.content}
            </p>
            <Link
              to="/products/$productId"
              params={{ productId: productPathParam(review) }}
              className="mt-auto truncate border-line border-t pt-3 text-caption text-sub hover:text-ink"
            >
              {review.productName}
            </Link>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
