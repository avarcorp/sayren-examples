import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * 시트 — 모바일은 아래에서 올라오는 시트, 데스크톱(md 이상)은 가운데 대화상자다.
 * Esc·바깥 누르기·닫기 버튼으로 닫고, 열린 동안 body 스크롤을 막고, 닫히면 열었던 요소로 초점을 돌려준다.
 * 내용이 길면 몸통만 스크롤되고 머리·바닥(footer)은 고정이다.
 */
export function Sheet({
  open,
  onClose,
  title,
  closeLabel,
  footer,
  children,
  desktop = "dialog",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** 닫기 버튼의 접근성 이름 */
  closeLabel: string;
  footer?: ReactNode;
  children: ReactNode;
  /** 데스크톱에서도 아래 시트로 둘 때 "sheet" */
  desktop?: "dialog" | "sheet";
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  const dialog = desktop === "dialog";
  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center ${dialog ? "md:items-center md:p-6" : ""}`}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute inset-0 bg-black/45"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[88dvh] w-full flex-col bg-page outline-none ${dialog ? "md:max-h-[80vh] md:max-w-lg" : ""}`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-line border-b pr-1 pl-4">
          <h2 id={titleId} className="font-bold text-[1.0625rem]">
            {title}
          </h2>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="flex size-11 items-center justify-center"
          >
            <X aria-hidden="true" className="size-5" strokeWidth={1.6} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
        {footer ? (
          <div className="shrink-0 border-line border-t px-4 pt-2.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
