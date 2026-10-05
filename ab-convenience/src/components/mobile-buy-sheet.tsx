import { useCallback, useState } from "react";
import { m } from "../i18n";
import { HeartIcon, ProductBuyBox, PurchaseButtons, useWishToggle } from "./product-buy-box";
import { usePurchase } from "./purchase-context";
import { Sheet } from "./ui/sheet";

/**
 * 모바일 하단 구매 막대 — [찜 52px][구매하기]. 구매하기를 누르면 옵션 시트가 올라오고, 시트 안에서 고른 뒤
 * 바닥의 [장바구니][바로구매]로 담거나 산다. 옵션 없는 상품도 수량을 확인하도록 시트를 연다.
 * Esc·바깥 누르기·닫기 버튼으로 닫는다(`Sheet`). 막대는 기기 안전 영역(아래)만큼 올라간다.
 */
export function MobileBuySheet() {
  const { product } = usePurchase();
  const wish = useWishToggle();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      {/* 막대가 본문 끝을 가리지 않게 자리를 둔다 */}
      <div aria-hidden="true" className="h-[calc(4.75rem+env(safe-area-inset-bottom))] md:hidden" />
      {wish.message ? (
        <p
          role="status"
          className="fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-30 mx-4 bg-ink p-3 text-body text-white md:hidden"
        >
          {wish.message}
        </p>
      ) : null}
      <nav
        aria-label={m.pd_mobile_bar()}
        className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-line border-t bg-page px-4 pt-2.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] md:hidden"
      >
        <button
          type="button"
          aria-label={wish.wished ? m.pd_bar_wished() : m.pd_bar_wish()}
          aria-pressed={wish.wished}
          disabled={wish.pending}
          onClick={wish.toggle}
          className="flex size-[3.25rem] shrink-0 items-center justify-center border border-line-strong bg-page disabled:opacity-50"
        >
          <HeartIcon filled={wish.wished} className="size-[1.375rem]" />
        </button>
        <button
          type="button"
          disabled={product.soldOut}
          onClick={() => setOpen(true)}
          className="flex h-[3.25rem] min-w-0 flex-1 items-center justify-center rounded-control border border-brand bg-brand font-bold text-base text-white disabled:border-line disabled:bg-chip disabled:text-muted"
        >
          {product.soldOut ? m.product_card_sold_out() : m.pd_bar_buy()}
        </button>
      </nav>
      <Sheet
        open={open}
        onClose={close}
        title={m.pd_sheet_title()}
        closeLabel={m.pd_sheet_close()}
        desktop="sheet"
        footer={<PurchaseButtons />}
      >
        <ProductBuyBox mode="sheet" />
      </Sheet>
    </>
  );
}
