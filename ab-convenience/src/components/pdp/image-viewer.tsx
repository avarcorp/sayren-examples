import useEmblaCarousel from "embla-carousel-react";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { m } from "../../i18n";

/**
 * 모바일 전체 화면 이미지 보기 — 검은 바탕에 원본 비율(object-contain)로 좌우로 넘긴다.
 * Esc·닫기 버튼으로 닫고, 열린 동안 body 스크롤을 막고, 닫히면 연 요소로 초점을 돌려준다.
 */
export function ImageViewer({
  sources,
  altOf,
  startIndex,
  onClose,
  onIndexChange,
}: {
  sources: string[];
  altOf: (index: number) => string;
  startIndex: number;
  onClose: () => void;
  /** 넘긴 자리를 상세 캐러셀에도 맞춘다 */
  onIndexChange: (index: number) => void;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ startIndex });
  const [index, setIndex] = useState(startIndex);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const next = emblaApi.selectedScrollSnap();
      setIndex(next);
      onIndexChange(next);
    };
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onIndexChange]);

  // 닫기·넘김은 최신 함수를 ref로 읽는다 — 부모가 다시 그려져도 초점·스크롤 잠금을 다시 걸지 않는다
  const latest = useRef({ onClose, emblaApi });
  latest.current = { onClose, emblaApi };
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") latest.current.onClose();
      else if (event.key === "ArrowLeft") latest.current.emblaApi?.scrollPrev();
      else if (event.key === "ArrowRight") latest.current.emblaApi?.scrollNext();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={m.pd_gallery_viewer_title()}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-black text-white outline-none"
    >
      <div className="flex h-14 shrink-0 items-center justify-between pr-1 pl-4">
        <span aria-live="polite" className="tabular text-meta">
          {m.pd_gallery_position({ current: index + 1, total: sources.length })}
        </span>
        <button
          type="button"
          aria-label={m.pd_gallery_viewer_close()}
          onClick={onClose}
          className="flex size-11 items-center justify-center"
        >
          <X aria-hidden="true" className="size-6" strokeWidth={1.6} />
        </button>
      </div>
      <div ref={emblaRef} className="min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full touch-pan-y">
          {sources.map((src, i) => (
            <div key={src} className="flex min-w-0 shrink-0 grow-0 basis-full items-center">
              <img
                src={src}
                alt={altOf(i)}
                loading={Math.abs(i - startIndex) > 1 ? "lazy" : undefined}
                className="max-h-full w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="h-[max(1rem,env(safe-area-inset-bottom))] shrink-0" />
    </div>,
    document.body,
  );
}
