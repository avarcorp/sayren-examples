import { useEffect, useId, useRef } from "react";
import { buttonClass } from "./ui/button";

/**
 * 확인 대화상자 — 되돌릴 수 없는 동작(리뷰 삭제 등) 전에 묻는다. 브라우저 `confirm()`을 쓰지 않는다.
 * 열리면 「취소」에 포커스, Esc·바깥 누르기는 취소다. Tab은 두 버튼 안에서만 돈다.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const bodyId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  // 부모가 렌더마다 새 함수를 넘겨도 열린 동안 포커스를 다시 잡지 않게 ref로 읽는다
  const cancelHandler = useRef(onCancel);
  cancelHandler.current = onCancel;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelHandler.current();
      if (event.key === "Tab") {
        // 두 버튼 사이에서만 돈다
        event.preventDefault();
        const next = document.activeElement === cancelRef.current ? confirmRef : cancelRef;
        next.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-label={cancelLabel}
        onClick={onCancel}
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="relative flex w-full max-w-sm flex-col gap-3 bg-page p-6"
      >
        <h2 id={titleId} className="break-words font-bold text-lg">
          {title}
        </h2>
        <p id={bodyId} className="break-words text-body text-sub">
          {body}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={buttonClass({ variant: "subtle", size: "md", block: true })}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={buttonClass({ variant: "primary", size: "md", block: true })}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
