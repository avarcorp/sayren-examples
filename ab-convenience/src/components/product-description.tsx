import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { m } from "../i18n";

/**
 * 상품 상세설명 렌더.
 *
 * 상세설명은 셀러가 상점 플랫폼 에디터로 쓴 HTML이다. API가 **쓰기 시점에 허용목록으로 정화한
 * HTML만 저장**하므로(@avarlabs/editor의 허용목록) 그대로 그려도 된다.
 *
 * 단, 그 기능 이전에 저장된 레거시 평문은 정화된 적이 없다. 그래서 "HTML인지"를
 * 단순히 '<' 포함이 아니라 **에디터가 생성하는 블록 태그로 시작하는지**로 판별한다.
 * 레거시 평문(`10<20`, `<img onerror=...>`)은 이 패턴으로 시작하지 않으므로 평문 분기로
 * 가 React가 이스케이프 렌더 → XSS·표시 깨짐이 모두 방지된다.
 *
 * 확장 지점 — 활자(본문 크기·제목·인용)는 아래 클래스가 정한다. 사진 줄·재생기 틀·
 * 구분선 같은 에디터 고유 모양은 `styles.css`가 불러오는 reader.css가 맡는다.
 * 이미지·표·영상은 본문 폭을 넘지 않고, 넓은 표는 표 안에서만 가로로 밀린다.
 */
const EDITOR_HTML_START = /^\s*<(?:p|h[1-6]|ul|ol|hr|figure|table|blockquote|pre)[\s>/]/i;

/** 모바일에서 이보다 길면 접어 두고 「상품 정보 더 보기」로 편다(px) */
const MOBILE_FOLD_HEIGHT = 960;

const HTML_CLASS =
  "break-words text-body leading-[1.8] md:text-body-lg [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-line [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-caption [&_figcaption]:text-muted [&_figure]:my-5 [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:font-bold [&_h2]:text-lg [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:font-bold [&_h3]:text-base [&_hr]:my-4 [&_iframe]:max-w-full [&_img]:h-auto [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:bg-chip [&_pre]:p-4 [&_pre]:text-caption [&_table]:my-4 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_td]:border [&_td]:border-line [&_td]:p-2 [&_th]:border [&_th]:border-line [&_th]:bg-chip [&_th]:p-2 [&_ul]:list-disc [&_ul]:pl-5 [&_video]:h-auto [&_video]:max-w-full";

export function ProductDescription({ description }: { description: string }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [long, setLong] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // 서버 렌더는 펼친 채로 그리고, 브라우저에서 길이를 잰 뒤에만 접는다(자바스크립트 없이도 다 읽힌다)
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const measure = () => setLong(body.scrollHeight > MOBILE_FOLD_HEIGHT + 120);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    return () => observer.disconnect();
  }, []);

  const folded = long && !expanded;
  const html = EDITOR_HTML_START.test(description);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[53.75rem] flex-col gap-4">
      <div
        className={`relative min-w-0 ${folded ? "max-md:max-h-[60rem] max-md:overflow-hidden" : ""}`}
      >
        {html ? (
          <div
            ref={bodyRef}
            className={HTML_CLASS}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: 에디터 블록 태그로 시작하는 콘텐츠만 진입 — 서버 쓰기 시점 정화 불변식 신뢰 (위 주석)
            dangerouslySetInnerHTML={{ __html: description }}
          />
        ) : (
          <div ref={bodyRef}>
            <p className="whitespace-pre-line break-words text-body leading-[1.8] md:text-body-lg">
              {description}
            </p>
          </div>
        )}
        {folded ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-page md:hidden"
          />
        ) : null}
      </div>
      {long ? (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => {
            // 접으면 본문 처음으로 돌아가 접힌 자리를 보인다
            if (expanded) bodyRef.current?.scrollIntoView({ block: "start" });
            setExpanded(!expanded);
          }}
          className="flex h-12 items-center justify-center gap-1 border border-ink bg-page font-bold text-body md:hidden"
        >
          {expanded ? m.pd_description_less() : m.pd_description_more()}
          <ChevronDown
            aria-hidden="true"
            strokeWidth={1.6}
            className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      ) : null}
    </div>
  );
}
