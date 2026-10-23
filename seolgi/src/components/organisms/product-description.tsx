/**
 * 상품 상세설명. 셀러가 에디터로 쓴 HTML이고, API가 쓰는 시점에 허용목록으로 정화한 것만 저장한다.
 * 정화 이전의 레거시 평문은 에디터 블록 태그로 시작하지 않으므로 평문으로 그린다(React가 이스케이프한다).
 */
const EDITOR_HTML_START = /^\s*<(?:p|h[1-6]|ul|ol|hr|figure|table|blockquote|pre)[\s>/]/i;

export const HTML_CLASS =
  "break-words text-lead leading-[1.9] text-prose [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-line [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_figure]:my-5 [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-title [&_h2]:text-ink [&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:font-bold [&_img]:h-auto [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_table]:my-4 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_td]:border [&_td]:border-line [&_td]:p-2 [&_th]:border [&_th]:border-line [&_th]:p-2 [&_ul]:list-disc [&_ul]:pl-5";

export function ProductDescription({ description }: { description: string }) {
  if (!description.trim()) return null;
  return EDITOR_HTML_START.test(description) ? (
    <div
      className={HTML_CLASS}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: 에디터 블록 태그로 시작하는 콘텐츠만 들어온다 — 서버가 쓰기 시점에 정화한다
      dangerouslySetInnerHTML={{ __html: description }}
    />
  ) : (
    <p className="whitespace-pre-line break-words text-lead text-prose leading-[1.9]">
      {description}
    </p>
  );
}
