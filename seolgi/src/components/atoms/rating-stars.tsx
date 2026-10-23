import { Star } from "lucide-react";

/** 별점 — 채운 별 n개. 화면 읽기에는 「n점」으로 읽힌다 */
export function RatingStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "size-3" : "size-4";
  return (
    <span className="flex text-ink" role="img" aria-label={`${rating}점`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${cls} ${n <= Math.round(rating) ? "fill-ink" : ""}`}
          aria-hidden
        />
      ))}
    </span>
  );
}
