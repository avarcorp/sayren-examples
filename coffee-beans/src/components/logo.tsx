import { Link } from "@tanstack/react-router";

/** 글자 로고 — 상점 이름(상점 설정 값) + 대표 색 점 세 개(월·수·금 로스팅, 02 브랜드 §4) */
export function Logo({ name }: { name: string }) {
  return (
    <Link
      to="/"
      className="flex min-h-11 min-w-0 items-center gap-1.5 font-bold text-[17px] tracking-tight"
    >
      <span className="truncate">{name}</span>
      <span aria-hidden className="flex shrink-0 gap-[3px]">
        <span className="size-[5px] rounded-full bg-point" />
        <span className="size-[5px] rounded-full bg-point" />
        <span className="size-[5px] rounded-full bg-point" />
      </span>
    </Link>
  );
}
