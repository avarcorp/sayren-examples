/**
 * 버튼 원자 — `<button>`·`<Link>`·`SubmitButton` 어디에나 붙이는 클래스 문자열이다.
 *
 * - primary: 화면의 주 행동(바로구매·주문하기). 화면당 하나
 * - outline: 나란히 놓는 보조 행동(장바구니)
 * - point: 결제 버튼에만 쓴다
 * - subtle: 표·카드 안의 작은 행동(배송 조회·리뷰 쓰기·주소 검색)
 * - ghost: 글자 링크처럼 보이는 버튼
 *
 * 높이: lg 56 · md 48 · sm 40 · xs 32. 모서리는 토큰(`rounded-control`)을 따른다.
 */
export type ButtonVariant = "primary" | "outline" | "point" | "subtle" | "ghost";
export type ButtonSize = "lg" | "md" | "sm" | "xs";

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-control whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:border-line disabled:bg-chip disabled:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "border border-ink bg-ink font-bold text-white hover:bg-ink/85",
  outline: "border border-ink bg-page font-bold text-ink hover:bg-chip",
  point: "border border-point bg-point font-bold text-white hover:bg-point/90",
  subtle: "border border-line-strong bg-page text-ink hover:border-ink",
  ghost: "text-sub underline-offset-4 hover:text-ink hover:underline",
};

const SIZE: Record<ButtonSize, string> = {
  lg: "h-14 px-5 text-base",
  md: "h-12 px-4 text-body-lg",
  sm: "h-10 px-3.5 text-meta",
  xs: "h-8 px-2.5 text-caption",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  block = false,
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
} = {}): string {
  return [
    BASE,
    VARIANT[variant],
    variant === "ghost" ? "" : SIZE[size],
    block ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/** 입력 칸 원자 — 높이 48, 테두리 line-strong, 초점·오류는 잉크·포인트 테두리 */
export function inputClass({ invalid = false, readOnly = false, className = "" } = {}): string {
  return [
    "h-12 w-full min-w-0 rounded-control border bg-page px-3.5 text-body text-ink placeholder:text-muted focus:border-ink focus:outline-none",
    invalid ? "border-point" : "border-line-strong",
    readOnly ? "bg-chip" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/** 네이티브 라디오·체크박스 — 브라우저 컨트롤에 잉크 강조색만 입힌다(키보드·스크린 리더 그대로) */
export const choiceClass = "size-5 shrink-0 accent-ink";
