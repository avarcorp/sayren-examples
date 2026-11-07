import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { m } from "../../i18n";
import { ProductImage } from "./product-image";

/** 상세 사진 넘김 — 한 장씩 밀어 넘기고, 아래 썸네일로 바로 간다. 사진이 없으면 자리 표시 하나 */
export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [viewportRef, embla] = useEmblaCarousel({ loop: false });
  const [index, setIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (embla) setIndex(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla, onSelect]);

  if (images.length === 0) return <ProductImage src={null} alt={name} />;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden" ref={viewportRef}>
        <ul className="flex">
          {images.map((src, i) => (
            <li key={src} className="min-w-0 flex-[0_0_100%]">
              <ProductImage
                src={src}
                alt={m.gallery_alt({ name, index: i + 1, total: images.length })}
                eager={i === 0}
              />
            </li>
          ))}
        </ul>
        {images.length > 1 ? (
          <p className="tabular absolute right-3 bottom-3 bg-page px-2 py-0.5 text-caption">
            {index + 1} / {images.length}
          </p>
        ) : null}
      </div>
      {images.length > 1 ? (
        <ul className="scroll-row flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <li key={src} className="w-16 shrink-0">
              <button
                type="button"
                onClick={() => embla?.scrollTo(i)}
                aria-label={m.gallery_go({ index: i + 1 })}
                aria-current={i === index}
                className={`block w-full border ${i === index ? "border-point" : "border-transparent"}`}
              >
                <ProductImage src={src} alt="" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
