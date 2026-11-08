import { X } from "lucide-react";
import { useState } from "react";
import { m } from "../../i18n";
import { ProductImage } from "../product-image";
import { cx } from "../ui";

/** 갤러리 — 큰 사진 + 아래 썸네일. 큰 사진을 누르면 확대해 본다 */
export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const current = images[index] ?? null;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <button
        type="button"
        className="block w-full"
        aria-label={m.gallery_zoom()}
        onClick={() => current && setZoom(true)}
      >
        <ProductImage src={current} alt={name} eager />
      </button>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={m.gallery_thumb({ index: i + 1 })}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={cx("w-16 shrink-0 rounded-card", i === index && "ring-2 ring-point")}
            >
              <ProductImage src={src} alt="" />
            </button>
          ))}
        </div>
      ) : null}
      {zoom && current ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-4">
          <button
            type="button"
            aria-label={m.nav_close()}
            className="absolute inset-0"
            onClick={() => setZoom(false)}
          />
          <img src={current} alt={name} className="relative max-h-full max-w-full object-contain" />
          <button
            type="button"
            aria-label={m.nav_close()}
            className="absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-page"
            onClick={() => setZoom(false)}
          >
            <X className="size-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
