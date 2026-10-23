import { Link } from "@tanstack/react-router";
import { BrandMark } from "../atoms/brand-mark";
import { buttonClass } from "../atoms/button";

export interface HeroContent {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  /** 버튼이 갈 카테고리. 상점에 그 카테고리가 없으면 전체 상품 */
  categoryId: string | null;
  /** 큰 그림. 없으면 브랜드 심볼로 채운다 */
  imageUrl?: string | null;
}

/** 홈 첫 화면 — 크림 면 위 왼쪽 아래에 문구와 주 버튼 */
export function Hero({ content }: { content: HeroContent }) {
  return (
    <section className="relative flex min-h-[460px] items-end overflow-hidden bg-tone-cream md:min-h-[560px]">
      {content.imageUrl ? (
        <img
          src={content.imageUrl}
          alt=""
          className="absolute inset-y-0 right-0 h-full w-full object-cover md:w-3/5"
        />
      ) : (
        <BrandMark className="absolute -top-6 -right-10 w-[min(70vw,560px)] text-brand md:top-12 md:right-14" />
      )}
      <div className="relative flex max-w-[520px] flex-col gap-4 p-6 md:p-14">
        <span className="text-muted text-small">{content.eyebrow}</span>
        <h1 className="font-display text-hero leading-[1.2]">{content.title}</h1>
        <p className="text-lead text-prose leading-[1.8]">{content.body}</p>
        <Link
          to="/products"
          search={content.categoryId ? { categoryId: content.categoryId } : {}}
          className={`mt-2 self-start ${buttonClass()}`}
        >
          {content.cta}
        </Link>
      </div>
    </section>
  );
}
