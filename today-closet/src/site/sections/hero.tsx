import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { buttonClass } from "../../components/ui/button";
import { m } from "../../i18n";
import type { SectionOf } from "../layout-schema";
import { fill, SiteLink } from "../site-link";

type Slide = SectionOf<"hero">["slides"][number];

const AUTOPLAY_MS = 6000;

function Cta({ slide, light }: { slide: Slide; light?: boolean }) {
  if (!slide.cta) return null;
  return (
    <SiteLink
      to={slide.cta.to}
      className={buttonClass({
        variant: light ? "outline" : "primary",
        size: "sm",
        className: light ? "border-white" : "",
      })}
    >
      {slide.cta.label}
    </SiteLink>
  );
}

function SlideText({
  slide,
  storeName,
  light,
}: {
  slide: Slide;
  storeName: string;
  light?: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-2 md:gap-3">
      <h2 className="break-words font-bold font-display text-2xl tracking-tight md:text-4xl">
        {fill(slide.title, storeName)}
      </h2>
      {slide.subtitle ? (
        <p className={`text-body md:text-body-lg ${light ? "text-white/90" : "text-sub"}`}>
          {fill(slide.subtitle, storeName)}
        </p>
      ) : null}
      <div className="mt-2">
        <Cta slide={slide} light={light} />
      </div>
    </div>
  );
}

/** 모바일은 화면 끝까지 닿는 4:5, 데스크톱은 본문 폭 16:7 */
const BLEED = "-mx-4 md:mx-0";
const FRAME = "relative aspect-[4/5] overflow-hidden bg-ink md:aspect-[16/7]";

function FullBleed({
  slide,
  storeName,
  eager = true,
}: {
  slide: Slide;
  storeName: string;
  eager?: boolean;
}) {
  return (
    <div className={FRAME}>
      {slide.image ? (
        <img
          src={slide.image}
          alt={slide.imageAlt ?? ""}
          loading={eager ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-5 pt-16 pb-12 text-white md:px-12 md:pb-14">
        <SlideText slide={slide} storeName={storeName} light />
      </div>
    </div>
  );
}

function Split({ slide, storeName }: { slide: Slide; storeName: string }) {
  return (
    <div className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
      <SlideText slide={slide} storeName={storeName} />
      {slide.image ? (
        <img
          src={slide.image}
          alt={slide.imageAlt ?? ""}
          className="aspect-[4/3] w-full bg-chip object-cover"
        />
      ) : (
        <div className="aspect-[4/3] w-full bg-surface" />
      )}
    </div>
  );
}

/** 넘김 — 손가락으로 밀거나 이전·다음. 자동 넘김은 설정이 켰을 때만, 움직임 줄이기를 켠 구매자에게는 켜지 않는다 */
function Carousel({
  slides,
  storeName,
  autoplay,
}: {
  slides: Slide[];
  storeName: string;
  autoplay: boolean;
}) {
  const count = slides.length;
  const [viewport, api] = useEmblaCarousel({ loop: count > 1 });
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);
  useEffect(() => {
    if (!api || !autoplay || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => api.scrollNext(), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [api, autoplay, count]);
  if (count === 0) return null;
  const control =
    "flex size-8 items-center justify-center bg-black/40 text-white hover:bg-black/60";
  return (
    <section
      className={`relative ${BLEED}`}
      aria-roledescription="carousel"
      aria-label={m.hero_label()}
    >
      <div ref={viewport} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide, i) => (
            // biome-ignore lint/a11y/useSemanticElements: WAI-ARIA 캐러셀 패턴의 슬라이드는 group + roledescription이다
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: 슬라이드는 순서가 곧 정체다
              key={`${slide.title}-${i}`}
              role="group"
              aria-roledescription="slide"
              aria-label={m.hero_slide_label({ index: i + 1 })}
              className="min-w-0 shrink-0 grow-0 basis-full"
            >
              <FullBleed slide={slide} storeName={storeName} eager={i === 0} />
            </div>
          ))}
        </div>
      </div>
      {count > 1 ? (
        <div className="absolute right-4 bottom-4 flex items-center gap-px md:right-8 md:bottom-6">
          <button
            type="button"
            aria-label={m.hero_prev()}
            onClick={() => api?.scrollPrev()}
            className={`${control} max-md:hidden`}
          >
            <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={1.6} />
          </button>
          <span className="flex h-8 min-w-12 items-center justify-center bg-black/40 px-2.5 text-caption text-white tabular-nums">
            {index + 1} / {count}
          </span>
          <button
            type="button"
            aria-label={m.hero_next()}
            onClick={() => api?.scrollNext()}
            className={`${control} max-md:hidden`}
          >
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.6} />
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function HeroSection({
  section,
  storeName,
}: {
  section: SectionOf<"hero">;
  storeName: string;
}) {
  const first = section.slides[0];
  if (!first) return null;
  switch (section.variant) {
    case "split":
      return <Split slide={first} storeName={storeName} />;
    case "carousel":
      return <Carousel slides={section.slides} storeName={storeName} autoplay={section.autoplay} />;
    case "textOnly":
      return (
        <div className="flex justify-center py-8 text-center md:py-14 [&>div]:items-center">
          <SlideText slide={first} storeName={storeName} />
        </div>
      );
    default:
      return (
        <div className={BLEED}>
          <FullBleed slide={first} storeName={storeName} />
        </div>
      );
  }
}
