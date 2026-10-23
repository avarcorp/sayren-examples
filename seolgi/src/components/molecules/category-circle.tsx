import { Link } from "@tanstack/react-router";
import type { Tone } from "../../lib/tones";

/** 카테고리 바로가기 원 — 원 안에 첫 글자, 아래에 이름. 사진 대신 대분류 면 색을 쓴다 */
export function CategoryCircle({
  name,
  tone,
  link,
}: {
  name: string;
  tone: Tone;
  link: { to: "/products"; search: { categoryId: string } } | { to: "/collections" };
}) {
  return (
    <Link {...link} className="group flex flex-col items-center gap-3 text-body">
      <span
        aria-hidden
        className={`grid size-[clamp(64px,18vw,120px)] place-items-center rounded-full font-display text-h3 ${tone}`}
      >
        {name.slice(0, 1)}
      </span>
      <span className="text-center group-hover:underline">{name}</span>
    </Link>
  );
}
