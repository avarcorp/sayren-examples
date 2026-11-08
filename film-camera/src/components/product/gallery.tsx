import { useState } from "react";
import { m } from "../../i18n";
import { TypeCover } from "../product-card";

/** 상품 사진 — 큰 사진(4:3) + 아래 썸네일. 사진이 없거나 불러오지 못하면 빈 자리(TypeCover) */
export function Gallery({
  name,
  images,
  soldOut,
}: {
  name: string;
  images: string[];
  soldOut: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState<string[]>([]);
  if (images.length === 0) return <TypeCover soldOut={soldOut} size="detail" />;
  const current = images[Math.min(index, images.length - 1)] as string;
  return (
    <div className="flex flex-col gap-3">
      {broken.includes(current) ? (
        <TypeCover soldOut={soldOut} />
      ) : (
        <div className="aspect-[4/3] overflow-hidden border border-line">
          <img
            src={current}
            alt={m.product_photo_alt({ name, index: index + 1 })}
            onError={() => setBroken((list) => [...list, current])}
            className={`h-full w-full object-cover ${soldOut ? "opacity-50 grayscale" : ""}`}
          />
        </div>
      )}
      {images.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-current={i === index ? "true" : undefined}
                aria-label={m.product_photo_alt({ name, index: i + 1 })}
                className={`block size-16 overflow-hidden border ${i === index ? "border-ink" : "border-line"}`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
