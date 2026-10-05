import { useState } from "react";
import { m } from "../i18n";
import type { ReviewFailure } from "../lib/my-reviews";
import { ReviewImageField } from "./review-image-field";
import { SubmitButton } from "./submit-button";
import { buttonClass } from "./ui/button";

const MIN_LENGTH = 10;
const MAX_LENGTH = 2000;

export const REVIEW_FAILURE_MESSAGE: Record<ReviewFailure, () => string> = {
  TEST_PAYMENT: () => m.rw_form_test_payment(),
  PERIOD_EXPIRED: () => m.rw_form_period_expired(),
  NOT_WRITABLE: () => m.rw_form_not_writable(),
  UNKNOWN: () => m.rw_form_failed(),
};

export interface ReviewDraft {
  rating: number;
  content: string;
  images: string[];
}

/**
 * 리뷰 폼 — 별점(1~5, 라디오라 키보드로 고른다)·본문(10~2,000자)·사진(최대 5장). 작성·수정이 같이 쓴다.
 * 제출은 부모가 서버 함수로 하고 실패 사유를 돌려준다.
 */
export function ReviewForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: ReviewDraft;
  submitLabel: string;
  onSubmit: (draft: ReviewDraft) => Promise<ReviewFailure | null>;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [content, setContent] = useState(initial?.content ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const length = content.trim().length;

  return (
    <form
      className="flex min-w-0 flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (rating < 1) return setError(m.rw_form_rating_required());
        if (length < MIN_LENGTH) return setError(m.rw_form_too_short());
        setPending(true);
        setError(null);
        onSubmit({ rating, content: content.trim(), images })
          .then((failure) => {
            if (failure) setError(REVIEW_FAILURE_MESSAGE[failure]());
          })
          .catch(() => setError(m.rw_form_failed()))
          .finally(() => setPending(false));
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-bold text-body">{m.rw_form_rating()}</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <label
              key={star}
              className="cursor-pointer text-[2rem] leading-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink"
            >
              <input
                type="radio"
                name="rating"
                value={star}
                checked={rating === star}
                onChange={() => setRating(star)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={star <= rating ? "text-point" : "text-line-strong"}
              >
                ★
              </span>
              <span className="sr-only">{m.rw_form_rating_value({ star })}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex min-w-0 flex-col gap-2">
        <span className="font-bold text-body">{m.rw_form_content()}</span>
        <textarea
          name="content"
          value={content}
          maxLength={MAX_LENGTH}
          rows={8}
          onChange={(event) => setContent(event.target.value)}
          placeholder={m.rw_form_content_placeholder()}
          className="w-full min-w-0 border border-line-strong bg-page px-3.5 py-3 text-body placeholder:text-muted focus:border-ink focus:outline-none"
        />
        <span className="tabular block text-right text-caption text-muted">
          {m.rw_form_content_count({ count: length, max: MAX_LENGTH })}
        </span>
      </label>
      <ReviewImageField images={images} onChange={setImages} />
      {error ? (
        <p role="alert" className="text-body text-point">
          {error}
        </p>
      ) : null}
      <SubmitButton
        disabled={pending}
        className={buttonClass({ variant: "primary", size: "lg", block: true })}
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
