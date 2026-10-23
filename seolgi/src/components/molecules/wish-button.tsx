import { Heart } from "lucide-react";

/** 찜 버튼 — 정사각 테두리 상자 안 하트. 찜하면 primary로 채운다 */
export function WishButton({
  wished,
  busy,
  onToggle,
  size = "lg",
}: {
  wished: boolean;
  busy?: boolean;
  onToggle: () => void;
  size?: "md" | "lg";
}) {
  return (
    <button
      type="button"
      aria-label={wished ? "찜 해제" : "찜하기"}
      aria-pressed={wished}
      disabled={busy}
      onClick={onToggle}
      className={`grid shrink-0 place-items-center border border-line-strong bg-page hover:border-ink ${size === "lg" ? "size-14" : "size-13"}`}
    >
      <Heart
        className={`size-5 ${wished ? "fill-primary text-primary" : ""}`}
        strokeWidth={1.5}
        aria-hidden
      />
    </button>
  );
}
