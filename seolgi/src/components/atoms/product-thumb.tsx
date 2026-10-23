import type { Tone } from "../../lib/tones";

/**
 * 상품 그림 — 사진이 있으면 사진, 없으면 같은 비율의 글자 타일(빈 회색 상자를 쓰지 않는다).
 * 카드·장바구니·주문 줄이 같이 쓴다. `size="sm"`은 줄 썸네일(이름만 작게)이다.
 */
export function ProductThumb({
  src,
  name,
  tone = "bg-tone-plain",
  label,
  size = "md",
  className = "",
}: {
  src: string | null | undefined;
  name: string;
  tone?: Tone;
  label?: string | null;
  size?: "sm" | "md";
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        className={`aspect-[4/5] w-full bg-tone-plain object-cover ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`flex aspect-[4/5] w-full flex-col justify-between ${tone} ${size === "sm" ? "p-2" : "p-5"} ${className}`}
    >
      {size === "md" ? (
        <span className="text-caption text-muted">{label ?? "설기로운"}</span>
      ) : (
        <span />
      )}
      <span className={`font-display leading-tight ${size === "md" ? "text-h3" : "text-caption"}`}>
        {name}
      </span>
    </span>
  );
}
