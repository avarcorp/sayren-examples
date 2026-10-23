import { Star } from "lucide-react";

/** 별점 고르기 — 다섯 개 라디오. 고른 수까지 채운 별 */
export function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <fieldset className="flex gap-1">
      <legend className="sr-only">별점</legend>
      {[1, 2, 3, 4, 5].map((n) => (
        <label
          key={n}
          className="grid size-11 cursor-pointer place-items-center has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-primary"
        >
          <input
            type="radio"
            name="rating"
            value={n}
            className="sr-only"
            checked={value === n}
            onChange={() => onChange(n)}
          />
          <Star
            className={`size-7 ${n <= value ? "fill-primary text-primary" : "text-line-strong"}`}
            strokeWidth={1.5}
            aria-hidden
          />
          <span className="sr-only">{n}점</span>
        </label>
      ))}
    </fieldset>
  );
}
