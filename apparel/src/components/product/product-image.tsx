import { m } from "../../i18n";

/**
 * 상품 사진 3:4. 사진이 없으면 얇은 테두리 안에 작은 글자 로고만 둔다(이름은 카드 아래에 이미 있다)
 */
export function ProductImage({
  src,
  alt,
  eager = false,
  className = "",
}: {
  src: string | null;
  alt: string;
  eager?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative aspect-[3/4] overflow-hidden ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center border border-line">
          <span className="text-caption text-muted uppercase tracking-[0.08em]">
            {m.brand_wordmark()}
          </span>
          <span className="sr-only">{m.product_no_photo()}</span>
        </div>
      )}
    </div>
  );
}
