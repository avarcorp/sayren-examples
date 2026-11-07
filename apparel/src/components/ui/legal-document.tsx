/**
 * 약관 문서 — 문단은 빈 줄로 나누고, 「제n조」로 시작하는 문단은 소제목으로 그린다.
 * 본문은 messages/ko.json의 terms_·privacy_ 키에 있다(법률 문서는 합니다체)
 */
export function LegalDocument({ body }: { body: string }) {
  const blocks = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  return (
    <article className="flex max-w-2xl flex-col gap-3 text-body text-sub">
      {blocks.map((block) =>
        /^제\d+조/.test(block) ? (
          <h2 key={block} className="pt-4 font-semibold text-body text-ink">
            {block}
          </h2>
        ) : (
          <p key={block} className="whitespace-pre-line break-words">
            {block}
          </p>
        ),
      )}
    </article>
  );
}
