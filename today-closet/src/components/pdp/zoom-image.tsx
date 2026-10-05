import { ZoomIn } from "lucide-react";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { m } from "../../i18n";
import { ProductThumb } from "../product-thumb";

/** 확대 배율 — 커서 자리를 기준으로 그 자리에서 키운다 */
const ZOOM_SCALE = 2.25;
/** 마우스처럼 정밀한 포인터로 hover할 수 있을 때만 확대한다(터치 기기는 탭이 곧 클릭이다) */
const FINE_HOVER = "(hover: hover) and (pointer: fine)";

function useFineHover(): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(FINE_HOVER);
    const update = () => setMatches(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return matches;
}

/**
 * 데스크톱 메인 이미지 — 마우스를 올리면 그 자리에서 확대되고 커서를 따라 움직인다(transform-origin).
 * 마우스 이동마다 다시 그리지 않도록 이미지 스타일을 직접 바꾼다. 우하단 힌트·좌하단 「현재 / 전체」는 겹쳐 그린다.
 */
export function ZoomImage({
  src,
  alt,
  position,
}: {
  src: string | null;
  alt: string;
  /** 좌하단 「현재 / 전체」 — 한 장이면 넘기지 않는다 */
  position: string | null;
}) {
  const imageRef = useRef<HTMLDivElement>(null);
  const fineHover = useFineHover();
  const zoomable = fineHover && Boolean(src);

  const place = (event: MouseEvent<HTMLDivElement>) => {
    const image = imageRef.current;
    if (!image || !zoomable) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 100;
    const y = ((event.clientY - box.top) / box.height) * 100;
    image.style.transformOrigin = `${x}% ${y}%`;
    image.style.transform = `scale(${ZOOM_SCALE})`;
  };
  const reset = () => {
    const image = imageRef.current;
    if (image) image.style.transform = "";
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: 마우스 확대는 보는 것만 바꾸는 장식이다(키보드·보조 기술은 같은 이미지를 그대로 받는다)
    <div
      onMouseEnter={place}
      onMouseMove={place}
      onMouseLeave={reset}
      className={`relative aspect-[4/5] w-full overflow-hidden bg-chip ${zoomable ? "cursor-zoom-in" : ""}`}
    >
      <div ref={imageRef} className="h-full w-full transition-transform duration-150 ease-out">
        <ProductThumb src={src} alt={alt} className="h-full w-full object-cover" />
      </div>
      {position ? (
        <span
          aria-live="polite"
          className="pointer-events-none absolute bottom-4 left-4 flex h-7 items-center bg-ink/70 px-2.5 text-caption text-white"
        >
          {position}
        </span>
      ) : null}
      {zoomable ? (
        <span className="pointer-events-none absolute right-4 bottom-4 flex h-7 items-center gap-1.5 bg-ink/70 px-2.5 text-caption text-white">
          <ZoomIn aria-hidden="true" className="size-3.5" strokeWidth={1.6} />
          {m.pd_gallery_zoom_hint()}
        </span>
      ) : null}
    </div>
  );
}
