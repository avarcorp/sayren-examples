import { useState } from "react";
import { cx } from "./ui";

/**
 * 상품 사진 — 정사각, 얇은 테두리. 사진을 불러오지 못하면 같은 칸에 작은 상품명만 남긴다(규칙 11의 조용한 자리)
 */
export function ProductImage({
  src,
  alt,
  className,
  eager,
}: {
  src: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={cx(
        "relative aspect-square overflow-hidden rounded-card border border-line bg-page",
        className ?? "w-full",
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center p-3 text-center text-caption text-muted">
          {alt}
        </span>
      )}
    </div>
  );
}
