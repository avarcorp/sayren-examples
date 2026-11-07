import { useState } from "react";
import { m } from "../../i18n";
import { formatMoney } from "../../lib/format";
import { Button } from "../ui/button";
import { Sheet } from "../ui/sheet";

const MIN_LENGTH = 10;

/** 리뷰 쓰기·고치기 — 별점과 10자 이상 내용. 저장은 부모가 넘긴 함수가 한다 */
export function ReviewSheet({
  open,
  title,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  initial?: { rating: number; content: string };
  onClose: () => void;
  onSubmit: (value: {
    rating: number;
    content: string;
  }) => Promise<{ ok: true; rewardPoint?: number } | { ok: false; message: string }>;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [content, setContent] = useState(initial?.content ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const tooShort = content.trim().length < MIN_LENGTH;

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 text-meta text-sub">{m.review_rating()}</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={value <= rating}
              aria-label={m.reviews_rating({ rating: value })}
              onClick={() => setRating(value)}
              className={`grid size-11 place-items-center text-xl ${value <= rating ? "text-point" : "text-line-strong"}`}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-content" className="text-meta text-sub">
          {m.review_content()}
        </label>
        <textarea
          id="review-content"
          rows={5}
          maxLength={2000}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={m.review_placeholder()}
          className="w-full border border-line-strong p-3 text-body focus:border-point focus:outline-none"
        />
        <p className="text-caption text-muted">{m.review_min_length()}</p>
      </div>
      {message ? (
        <p role="status" className="text-meta text-sale">
          {message}
        </p>
      ) : null}
      <Button
        disabled={tooShort || pending}
        onClick={async () => {
          setPending(true);
          const result = await onSubmit({ rating, content: content.trim() }).catch(() => null);
          setPending(false);
          if (!result) setMessage(m.common_error_retry());
          else if (!result.ok) setMessage(result.message);
          else if (result.rewardPoint && result.rewardPoint > 0) {
            setMessage(m.review_reward({ amount: formatMoney(result.rewardPoint) }));
          }
        }}
      >
        {m.review_save()}
      </Button>
    </Sheet>
  );
}
