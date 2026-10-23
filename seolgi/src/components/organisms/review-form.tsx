import { ImagePlus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../atoms/button";
import { ProductThumb } from "../atoms/product-thumb";
import { RatingInput } from "../molecules/rating-input";

export interface ReviewDraft {
  rating: number;
  content: string;
  images: string[];
}

const MAX_IMAGES = 5;

/**
 * 리뷰 쓰기·고치기 (와이어프레임 Review) — 상품, 별점, 본문(10자 이상), 사진(5장까지).
 * 사진은 업로드 자리를 받아 브라우저가 바로 올리고 공개 주소만 리뷰에 싣는다.
 */
export function ReviewForm({
  product,
  initial,
  submitLabel,
  rewardNote,
  onUpload,
  onSubmit,
}: {
  product: { name: string; optionName: string | null; thumbnailUrl: string | null };
  initial?: ReviewDraft;
  submitLabel: string;
  rewardNote?: string | null;
  onUpload: (file: File) => Promise<string | null>;
  onSubmit: (draft: ReviewDraft) => Promise<string | null>;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [content, setContent] = useState(initial?.content ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const short = content.trim().length < 10;
  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={async (e) => {
        e.preventDefault();
        if (short) {
          setError("리뷰는 10자 이상 작성하십시오.");
          return;
        }
        setBusy(true);
        setError(await onSubmit({ rating, content: content.trim(), images }));
        setBusy(false);
      }}
    >
      <div className="flex items-center gap-4 border-ink border-t pt-6">
        <span className="w-16 shrink-0">
          <ProductThumb src={product.thumbnailUrl} name={product.name} size="sm" />
        </span>
        <span className="flex flex-col gap-1 text-body">
          {product.name}
          {product.optionName ? (
            <span className="text-caption text-muted">{product.optionName}</span>
          ) : null}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium text-small">별점</span>
        <RatingInput value={rating} onChange={setRating} />
      </div>
      <label className="flex flex-col gap-2 font-medium text-small">
        리뷰
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          maxLength={2000}
          placeholder="사이즈·착용감·우리 아이 반응을 남겨 주십시오. 10자 이상 씁니다."
          className="border border-line-strong p-3 font-normal text-body outline-none focus:border-ink"
        />
        <span className="self-end font-normal text-caption text-muted">
          {content.trim().length} / 2000
        </span>
      </label>
      <div className="flex flex-col gap-2">
        <span className="font-medium text-small">
          사진 <span className="font-normal text-muted">선택 · {MAX_IMAGES}장까지</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {images.map((src) => (
            <span key={src} className="relative">
              <img src={src} alt="" className="size-20 object-cover" />
              <button
                type="button"
                aria-label="사진 빼기"
                onClick={() => setImages((prev) => prev.filter((s) => s !== src))}
                className="absolute top-0 right-0 grid size-7 place-items-center bg-ink/70 text-white"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </span>
          ))}
          {images.length < MAX_IMAGES ? (
            <label className="grid size-20 cursor-pointer place-items-center border border-line-strong border-dashed text-muted has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-primary">
              <ImagePlus className="size-5" aria-hidden />
              <span className="sr-only">사진 추가</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  setBusy(true);
                  const url = await onUpload(file);
                  setBusy(false);
                  if (url) setImages((prev) => [...prev, url]);
                  else setError("사진을 올리지 못했습니다. 10MB 이하 JPG·PNG·WEBP를 올리십시오.");
                }}
              />
            </label>
          ) : null}
        </div>
      </div>
      {rewardNote ? <p className="text-muted text-small">{rewardNote}</p> : null}
      {error ? (
        <p role="alert" className="text-primary text-small">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={busy} className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
