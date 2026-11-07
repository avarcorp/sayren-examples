import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { m } from "../../i18n";

/**
 * 시트·다이얼로그 — 모바일은 아래에서 올라오는 시트, 데스크톱은 가운데 창. 흰 바탕, 뒤는 반투명 막.
 * 열려 있는 동안 Esc로 닫고 본문 스크롤을 막는다
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  side = "bottom",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: "bottom" | "left";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  const panel =
    side === "left"
      ? "inset-y-0 left-0 w-[86%] max-w-sm"
      : "inset-x-0 bottom-0 max-h-[88vh] md:inset-auto md:top-1/2 md:left-1/2 md:w-[480px] md:-translate-x-1/2 md:-translate-y-1/2";
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label={m.common_close()}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute flex flex-col overflow-y-auto bg-page ${panel}`}
      >
        <div className="flex items-center justify-between border-line border-b px-4">
          <p className="py-3 font-semibold text-body-lg">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 grid size-11 place-items-center"
            aria-label={m.common_close()}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-4">{children}</div>
      </div>
    </div>
  );
}
