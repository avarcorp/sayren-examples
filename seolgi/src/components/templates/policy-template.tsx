import type { PolicyDocument } from "../../site/policies";

/** 약관·방침 문서 — 가운데 860px, 조항마다 제목과 문단 */
export function PolicyTemplate({ doc }: { doc: PolicyDocument }) {
  return (
    <article className="mx-auto flex max-w-[860px] flex-col gap-10 pt-12 pb-24">
      <header className="flex flex-col gap-2 border-ink border-b pb-6">
        <h1 className="font-display text-h1">{doc.title}</h1>
        <p className="text-muted text-small">시행일 {doc.updatedAt}</p>
      </header>
      {doc.sections.map((s) => (
        <section key={s.heading} className="flex flex-col gap-3">
          <h2 className="font-medium text-section">{s.heading}</h2>
          {s.paragraphs.map((p) => (
            <p key={p} className="text-body text-prose leading-[1.9]">
              {p}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
