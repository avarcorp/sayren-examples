import type { ReviewSummary } from "@sayren/storefront-sdk";

/** 평점 요약 — 큰 평균과 5→1점 분포 막대 */
export function RatingSummary({ summary }: { summary: ReviewSummary }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="flex items-baseline gap-2">
        <span className="font-light text-figure leading-none">
          {summary.averageRating.toFixed(1)}
        </span>
        <span className="text-body text-muted">/ 5</span>
      </p>
      <ul className="flex flex-col gap-2.5" aria-label="평점 분포">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = summary.distribution[String(star)] ?? 0;
          return (
            <li key={star} className="flex items-center gap-3 text-caption">
              <span className="w-7 text-muted">{star}점</span>
              <span className="relative h-0.5 flex-1 bg-line">
                <span
                  className="absolute inset-y-0 left-0 bg-ink"
                  style={{ width: `${summary.totalCount ? (n / summary.totalCount) * 100 : 0}%` }}
                />
              </span>
              <span className="w-8 text-right text-muted">{n}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
