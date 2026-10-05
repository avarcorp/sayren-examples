import type { ProductDetail } from "@sayren/storefront-sdk";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { m } from "../i18n";
import type { DetailLayout } from "../site/layout-schema";
import { ImageViewer } from "./pdp/image-viewer";
import { ZoomImage } from "./pdp/zoom-image";
import { ProductThumb } from "./product-thumb";

/** 대표 이미지 + 추가 이미지, 같은 주소는 한 번만 — 대표 이미지는 보통 `images[0]`과 같다 */
export function gallerySources(product: Pick<ProductDetail, "thumbnailUrl" | "images">): string[] {
  return [
    ...new Set([product.thumbnailUrl, ...product.images].filter((src): src is string => !!src)),
  ];
}

/**
 * 상품 이미지.
 * - 데스크톱(lg 이상): 왼쪽 세로 썸네일 줄(72px, 고른 썸네일 잉크 테두리) + 메인 이미지(마우스를 올리면 확대).
 * - lg 미만(모바일·태블릿): 스와이프 캐러셀(모바일은 화면 끝까지) + 우하단 「현재 / 전체」. 누르면 전체 화면으로 크게 본다.
 * 두 모양은 같은 고른 자리를 쓴다. `variant`는 레이아웃 설정 호환용이고 모양은 하나다.
 */
export function ProductGallery({
  product,
}: {
  product: ProductDetail;
  variant?: DetailLayout["gallery"];
}) {
  const sources = gallerySources(product);
  const total = Math.max(1, sources.length);
  const many = sources.length > 1;
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState(false);
  const current = Math.min(index, total - 1);
  const [emblaRef, emblaApi] = useEmblaCarousel({ watchDrag: many });

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const go = useCallback(
    (next: number) => {
      setIndex(next);
      emblaApi?.scrollTo(next, true);
    },
    [emblaApi],
  );
  const altOf = (i: number) =>
    i === 0 ? product.name : m.product_gallery_image_alt({ name: product.name, index: i + 1 });
  const position = many ? m.pd_gallery_position({ current: current + 1, total }) : null;

  return (
    <section aria-roledescription="carousel" aria-label={m.pd_gallery_label()}>
      {/* 데스크톱 — 썸네일 줄은 메인 이미지 높이 안에서만 세로로 넘긴다 */}
      <div
        className={`hidden lg:grid lg:gap-4 ${many ? "lg:grid-cols-[4.5rem_minmax(0,1fr)]" : ""}`}
      >
        {many ? (
          <div className="relative min-w-0">
            <ul className="absolute inset-0 flex flex-col gap-2 overflow-y-auto [scrollbar-width:none]">
              {sources.map((src, i) => (
                <li key={src} className="shrink-0">
                  <button
                    type="button"
                    aria-label={m.product_gallery_thumb_label({ index: i + 1 })}
                    aria-pressed={i === current}
                    onClick={() => go(i)}
                    onMouseEnter={() => go(i)}
                    className={`block aspect-[3/4] w-full overflow-hidden border-2 bg-chip ${
                      i === current ? "border-ink" : "border-transparent hover:border-line-strong"
                    }`}
                  >
                    <ProductThumb src={src} className="h-full w-full object-cover" loading="lazy" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="min-w-0">
          <ZoomImage src={sources[current] ?? null} alt={altOf(current)} position={position} />
        </div>
      </div>

      {/* lg 미만 — 스와이프 캐러셀, 누르면 전체 화면 보기 */}
      <div className="relative bg-chip lg:hidden">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex touch-pan-y">
            {sources.length ? (
              sources.map((src, i) => (
                <div key={src} className="min-w-0 shrink-0 grow-0 basis-full">
                  <button
                    type="button"
                    aria-label={m.pd_gallery_open_viewer({ index: i + 1 })}
                    onClick={() => {
                      setIndex(i);
                      setViewer(true);
                    }}
                    className="block w-full"
                  >
                    <ProductThumb
                      src={src}
                      alt={altOf(i)}
                      loading={i === 0 ? undefined : "lazy"}
                      className="aspect-[4/5] w-full object-cover"
                    />
                  </button>
                </div>
              ))
            ) : (
              <div className="min-w-0 shrink-0 grow-0 basis-full">
                <ProductThumb src={null} alt={product.name} className="aspect-[4/5] w-full" />
              </div>
            )}
          </div>
        </div>
        {position ? (
          <span
            aria-live="polite"
            className="pointer-events-none absolute right-3 bottom-3 flex h-6 items-center rounded-full bg-ink/60 px-2.5 text-caption text-white"
          >
            {position}
          </span>
        ) : null}
      </div>

      {viewer && sources.length ? (
        <ImageViewer
          sources={sources}
          altOf={altOf}
          startIndex={current}
          onClose={() => setViewer(false)}
          onIndexChange={go}
        />
      ) : null}
    </section>
  );
}
