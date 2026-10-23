import { Link } from "@tanstack/react-router";
import { buttonClass } from "../atoms/button";
import { NameTagArt } from "../atoms/name-tag-art";

export interface NameTagPromoContent {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
}

/** 이름표 주문제작 소개 — 크림 면 그림 + 문구 + 보조 버튼. 버튼은 이름표 상품(하나면) 또는 카테고리로 간다 */
export function NameTagPromo({
  content,
  target,
}: {
  content: NameTagPromoContent;
  target: { categoryId: string; productPath: string | null };
}) {
  const cls = `mt-2 self-start ${buttonClass({ variant: "outline" })}`;
  return (
    <section className="flex flex-wrap items-center gap-10 md:gap-14">
      <div className="flex aspect-[4/3] min-w-0 flex-[1_1_420px] items-center justify-center bg-tone-cream">
        <NameTagArt name="설기" className="h-[70%]" />
      </div>
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
        <span className="text-muted text-small">{content.eyebrow}</span>
        <h2 className="whitespace-pre-line font-display text-h1 leading-[1.25]">{content.title}</h2>
        <p className="text-lead text-prose leading-[1.8]">{content.body}</p>
        {target.productPath ? (
          <Link
            to="/products/$productNo"
            params={{ productNo: target.productPath }}
            className={cls}
          >
            {content.cta}
          </Link>
        ) : (
          <Link to="/products" search={{ categoryId: target.categoryId }} className={cls}>
            {content.cta}
          </Link>
        )}
      </div>
    </section>
  );
}
