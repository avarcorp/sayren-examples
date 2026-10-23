import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { Purchase } from "../../hooks/use-purchase";
import { Button } from "../atoms/button";
import { WishButton } from "../molecules/wish-button";

/** 모바일 하단 막대(찜 + 구매하기) → 옵션 시트 (시안 PdpMobile·PdpSheet). 시트 안은 데스크톱과 같은 구매 영역이다 */
export function MobileBuy({
  purchase,
  ordering,
  wish,
  cta = "구매하기",
  children,
}: {
  purchase: Purchase;
  ordering: boolean;
  wish?: { wished: boolean; busy: boolean; toggle: () => void };
  cta?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  if (!ordering) return null;
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-line border-t bg-page px-4 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden">
        {wish ? (
          <WishButton wished={wish.wished} busy={wish.busy} onToggle={wish.toggle} size="md" />
        ) : null}
        <Button
          size="md"
          className="h-13 flex-1 text-lead"
          onClick={() => setOpen(true)}
          disabled={purchase.product.soldOut}
        >
          {purchase.product.soldOut ? "품절" : cta}
        </Button>
      </div>
      <dialog
        ref={dialog}
        aria-label="옵션 선택"
        onClose={() => setOpen(false)}
        className="mt-auto mb-0 max-h-[88vh] w-full max-w-none overflow-y-auto bg-page p-0 backdrop:bg-ink/40 md:hidden"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-page px-2 pt-2">
          <span aria-hidden className="ml-[calc(50%-18px)] h-1 w-9 rounded-sm bg-line-strong" />
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setOpen(false)}
            className="grid size-11 place-items-center"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="px-5 pb-6">{open ? children : null}</div>
      </dialog>
    </>
  );
}
