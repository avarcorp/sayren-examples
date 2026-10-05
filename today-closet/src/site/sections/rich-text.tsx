import type { SectionOf } from "../layout-schema";
import { fill } from "../site-link";

/** 제목과 문단 — HTML은 받지 않고 텍스트로만 그린다(줄바꿈은 그대로) */
export function RichTextSection({
  section,
  storeName,
}: {
  section: SectionOf<"richText">;
  storeName: string;
}) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-3">
      {section.title ? (
        <h2 className="break-words font-bold font-display text-xl tracking-tight md:text-2xl">
          {fill(section.title, storeName)}
        </h2>
      ) : null}
      {section.paragraphs.map((paragraph, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 문단은 순서가 곧 정체다
        <p key={index} className="whitespace-pre-line break-words text-body md:text-body-lg">
          {fill(paragraph, storeName)}
        </p>
      ))}
    </section>
  );
}
