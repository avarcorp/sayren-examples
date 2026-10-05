import { buttonClass } from "../../components/ui/button";
import type { SectionOf } from "../layout-schema";
import { fill, SiteLink } from "../site-link";

/** 브랜드 이야기 — 이미지와 문단 3개까지. 문단은 텍스트로만 그린다 */
export function BrandStorySection({
  section,
  storeName,
}: {
  section: SectionOf<"brandStory">;
  storeName: string;
}) {
  const withImage = section.variant !== "textOnly" && section.image;
  const text = (
    <div className="flex min-w-0 flex-col gap-4">
      <h2 className="break-words font-bold font-display text-xl tracking-tight md:text-2xl">
        {fill(section.title, storeName)}
      </h2>
      {section.paragraphs.map((paragraph, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 문단은 순서가 곧 정체다
        <p key={index} className="whitespace-pre-line text-body text-sub md:text-body-lg">
          {fill(paragraph, storeName)}
        </p>
      ))}
      {section.cta ? (
        <SiteLink
          to={section.cta.to}
          className={buttonClass({ variant: "outline", size: "sm", className: "self-start" })}
        >
          {section.cta.label}
        </SiteLink>
      ) : null}
    </div>
  );
  if (!withImage) {
    return <section className="mx-auto max-w-2xl py-6 text-center">{text}</section>;
  }
  return (
    <section className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
      <img
        src={section.image}
        alt={section.imageAlt ?? ""}
        loading="lazy"
        className={`aspect-[4/3] w-full bg-chip object-cover ${
          section.variant === "imageRight" ? "md:order-last" : ""
        }`}
      />
      {text}
    </section>
  );
}
