import { m } from "../i18n";

interface ProductThumbProps {
  /** 대표 이미지 주소. 등록된 이미지가 없으면 null이다 */
  src: string | null;
  alt?: string;
  /** 크기·모서리 등 자리 클래스 — 이미지와 자리표시가 같은 박스를 쓴다 */
  className: string;
  loading?: "lazy" | "eager";
}

/**
 * 상품 대표 이미지. `thumbnailUrl`이 null이면(이미지 없는 상품) 빈 자리를 그린다.
 * 상품 이미지는 셀러가 상점 플랫폼에서 올리므로 아직 안 올린 상품이 섞일 수 있다.
 */
export function ProductThumb({ src, alt = "", className, loading }: ProductThumbProps) {
  if (!src) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-chip text-muted text-xs`}
        role="img"
        aria-label={m.product_thumb_empty()}
      >
        {m.product_thumb_empty()}
      </div>
    );
  }
  return <img src={src} alt={alt} loading={loading} className={className} />;
}
