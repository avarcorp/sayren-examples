import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Tone } from "../../lib/tones";

interface Props {
  name: string;
  images: string[];
  tone: Tone;
  label: string | null;
}

/**
 * 상품 이미지 슬라이드 — 큰 이미지 한 장, 좌우 화살표, 장수 표시, 썸네일.
 * 사진이 없으면 같은 비율의 글자 타일을 그린다(빈 회색 상자를 쓰지 않는다).
 */
export function Gallery({ name, images, tone, label }: Props) {
  if (images.length === 0) {
    return (
      <div className={`flex aspect-square w-full flex-col justify-between p-8 md:p-12 ${tone}`}>
        <span className="text-small text-muted">{label ?? "설기로운"}</span>
        <span className="font-display text-display leading-tight">{name}</span>
      </div>
    );
  }
  return <Slider name={name} images={images} />;
}

function Slider({ name, images }: { name: string; images: string[] }) {
  const [ref, embla] = useEmblaCarousel({ loop: images.length > 1 });
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);
  const go = useCallback((i: number) => embla?.scrollTo(i), [embla]);
  const many = images.length > 1;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={`${name} 이미지`}
      className="flex flex-col gap-3"
    >
      <div className="relative">
        <div ref={ref} className="overflow-hidden">
          <div className="flex">
            {images.map((src, i) => (
              <div key={src} className="min-w-0 flex-[0_0_100%]">
                <img
                  src={src}
                  alt={i === 0 ? name : ""}
                  className="aspect-square w-full bg-tone-plain object-cover"
                />
              </div>
            ))}
          </div>
        </div>
        {many ? (
          <>
            <button
              type="button"
              aria-label="이전 이미지"
              onClick={() => embla?.scrollPrev()}
              className="absolute top-1/2 left-4 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-page/90"
            >
              <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="다음 이미지"
              onClick={() => embla?.scrollNext()}
              className="absolute top-1/2 right-4 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-page/90"
            >
              <ChevronRight className="size-5" strokeWidth={1.5} aria-hidden />
            </button>
            <span className="absolute right-4 bottom-4 rounded-full bg-page/90 px-2.5 py-1 text-caption">
              {index + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>
      {many ? (
        <div className="grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`${i + 1}번째 이미지`}
              aria-current={i === index}
              onClick={() => go(i)}
              className={`aspect-square border ${i === index ? "border-ink" : "border-transparent"}`}
            >
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
