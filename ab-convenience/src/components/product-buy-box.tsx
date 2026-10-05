import type { ProductFulfillmentView } from "@sayren/storefront-sdk";
import { useHydrated, useNavigate } from "@tanstack/react-router";
import { Heart, MessageCircle, Minus, Plus, Share2, X } from "lucide-react";
import { useRef, useState } from "react";
import { m } from "../i18n";
import { formatPrice } from "../lib/format";
import { MAX_LINE_QUANTITY, stepEnabled, stepValues } from "../lib/option-steps";
import { productPathParam } from "../lib/product-path";
import { toggleWish } from "../lib/wishlist";
import { OptionDropdown } from "./option-dropdown";
import { OrderingNotice, useOrdering } from "./ordering-notice";
import { ProductOptionFields } from "./product-option-fields";
import { usePurchase } from "./purchase-context";
import { StayDates } from "./stay-dates";
import { buttonClass } from "./ui/button";

/** 배송비 요약 한 줄 — 상품 데이터(배송비 유형·금액·조건부 무료 기준)만으로 만든다 */
export function deliverySummaryOf(fulfillment: ProductFulfillmentView): string {
  if (fulfillment.type === "SHIPPING") {
    const { deliveryType, deliveryFee, conditionalFreeAmount } = fulfillment.shipping;
    if (deliveryType === "FREE" || deliveryFee === 0) return m.pd_free_delivery();
    if (deliveryType === "CONDITIONAL_FREE" && conditionalFreeAmount) {
      return m.pd_delivery_fee_conditional({
        fee: formatPrice(deliveryFee),
        threshold: formatPrice(conditionalFreeAmount),
      });
    }
    return m.pd_delivery_fee({ fee: formatPrice(deliveryFee) });
  }
  return m.pd_delivery_manual();
}

/**
 * 구매 상자 — 「옵션 선택 *」 단계형 드롭다운, 추가 선택·직접 입력, 선택 행(chip 면), 총 상품 금액(잉크 선 위).
 * main: 상단 구매 영역 — 아래에 [찜][장바구니][바로구매]와 문의·공유 글자 링크 줄
 * sheet: 모바일 옵션 시트의 몸통 — 버튼은 시트 바닥(`PurchaseButtons`)이 그린다
 */
export function ProductBuyBox({
  mode,
  onInquiry,
}: {
  mode: "main" | "sheet";
  /** 「문의하기」 — Q&A 섹션으로 옮겨 간다 */
  onInquiry?: () => void;
}) {
  const purchase = usePurchase();
  const ordering = useOrdering();
  const wish = useWishToggle();

  return (
    <div className="flex flex-col gap-5">
      <OptionPicker compact={mode === "sheet"} />
      {purchase.dated ? <StayDates /> : null}
      <SelectedLines compact={mode === "sheet"} />
      <OrderingNotice ordering={ordering} />
      {mode === "main" && ordering.open ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_minmax(0,1fr)] gap-2">
            <WishSquare wish={wish} />
            <PurchaseButtons inline />
          </div>
          {wish.message ? (
            <p role="status" className="text-body">
              {wish.message}
            </p>
          ) : null}
          <PurchaseLinks onInquiry={onInquiry} />
        </div>
      ) : null}
      {purchase.error ? (
        <p role="alert" className="text-body text-point">
          {purchase.error}
        </p>
      ) : null}
    </div>
  );
}

/** 단계형 옵션 + 추가 선택·직접 입력 — 옵션 없는 상품은 추가 칸만 그린다 */
function OptionPicker({ compact }: { compact: boolean }) {
  const purchase = usePurchase();
  const { product, hasOptions, state } = purchase;
  const hydrated = useHydrated();
  const stepButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const extras = product.addonGroups.length > 0 || product.customInputs.length > 0;
  if (!hasOptions && !extras) return null;

  return (
    <div className="flex flex-col gap-2">
      {hasOptions ? (
        <fieldset className="flex min-w-0 flex-col gap-2">
          {/* 시트는 머리 제목이 이미 「옵션 선택」이라 범례를 화면에서 숨긴다 */}
          <legend className={compact ? "sr-only" : "mb-2 font-bold text-body"}>
            {m.pd_option_title()}{" "}
            <span aria-hidden="true" className="text-point">
              *
            </span>
            <span className="sr-only">{m.pd_option_required_mark()}</span>
          </legend>
          {product.optionGroups.map((group, step) => (
            <OptionDropdown
              key={group.groupId}
              name={group.name}
              values={stepValues(product, step, state.chosen)}
              selectedValueId={state.chosen[step] ?? null}
              locked={!stepEnabled(step, state.chosen)}
              inline={compact}
              buttonRef={(node) => {
                stepButtons.current[step] = node;
              }}
              onSelect={(valueId) => {
                purchase.choose(step, valueId);
                // 다음 단계가 열리면 그리로 포커스를 옮긴다(마지막 단계면 첫 단계로)
                const next = step + 1 < product.optionGroups.length ? step + 1 : 0;
                window.setTimeout(() => stepButtons.current[next]?.focus(), 0);
              }}
            />
          ))}
        </fieldset>
      ) : null}
      {extras ? (
        <div className="flex flex-col gap-3 pt-1">
          <ProductOptionFields
            addonGroups={product.addonGroups}
            customInputs={product.customInputs}
            selection={purchase.selection}
            problems={purchase.problems}
            hydrated={hydrated}
            onChange={purchase.setSelection}
          />
        </div>
      ) : null}
    </div>
  );
}

/** 선택 행 — 조합마다 수량 −/+·금액·삭제(chip 면), 아래에 잉크 선과 총 상품 금액 */
function SelectedLines({ compact }: { compact: boolean }) {
  const purchase = usePurchase();
  const { product, hasOptions, state, totals } = purchase;
  if (!state.lines.length) return null;
  const step = compact ? "size-9" : "size-8";
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {state.lines.map((line) => {
          const variant = product.variants.find((v) => v.variantId === line.variantId);
          if (!variant) return null;
          const name = hasOptions ? variant.name : product.name;
          const unit = purchase.unitOf(line.variantId);
          return (
            <li key={line.variantId} className="flex flex-col gap-3 bg-chip p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 break-words text-meta">{name}</span>
                {hasOptions ? (
                  <button
                    type="button"
                    aria-label={m.pd_line_remove({ name })}
                    onClick={() => purchase.remove(line.variantId)}
                    className="-m-1 shrink-0 p-1 text-muted hover:text-ink"
                  >
                    <X aria-hidden="true" className="size-4" strokeWidth={1.6} />
                  </button>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-stretch border border-line-strong bg-page text-meta">
                  <button
                    type="button"
                    aria-label={m.pd_line_decrease({ name })}
                    disabled={line.quantity <= 1}
                    onClick={() => purchase.setQuantity(line.variantId, line.quantity - 1)}
                    className={`flex ${step} items-center justify-center disabled:text-line-strong`}
                  >
                    <Minus aria-hidden="true" className="size-3.5" strokeWidth={1.6} />
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_LINE_QUANTITY}
                    aria-label={m.pd_line_quantity({ name })}
                    value={line.quantity}
                    onChange={(event) =>
                      purchase.setQuantity(line.variantId, Number(event.target.value))
                    }
                    className="tabular w-10 border-line border-x bg-page text-center [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    aria-label={m.pd_line_increase({ name })}
                    disabled={line.quantity >= MAX_LINE_QUANTITY}
                    onClick={() => purchase.setQuantity(line.variantId, line.quantity + 1)}
                    className={`flex ${step} items-center justify-center disabled:text-line-strong`}
                  >
                    <Plus aria-hidden="true" className="size-3.5" strokeWidth={1.6} />
                  </button>
                </div>
                <span className="tabular font-bold text-body-lg">
                  {formatPrice(unit * line.quantity)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <div
        className={`flex items-baseline justify-between gap-3 ${compact ? "pt-1" : "border-ink border-t pt-4"}`}
        aria-live="polite"
      >
        <span className="text-body">
          {m.pd_total_amount()}{" "}
          <span className="text-muted">{m.pd_total_count({ count: totals.count })}</span>
        </span>
        <strong className={`tabular font-bold ${compact ? "text-xl" : "text-2xl"}`}>
          {formatPrice(totals.amount)}
        </strong>
      </div>
    </div>
  );
}

/**
 * 장바구니(outline)·바로구매(primary) — 상단 구매 영역·따라오는 상자·모바일 시트 바닥이 같이 쓴다.
 * `inline`이면 감싸는 grid 칸에 그대로 들어간다(찜 버튼 옆).
 */
export function PurchaseButtons({
  inline = false,
  size = "lg",
}: {
  inline?: boolean;
  size?: "lg" | "md";
}) {
  const purchase = usePurchase();
  const { product } = purchase;
  const hydrated = useHydrated();
  const disabled = !hydrated || purchase.submitting || product.soldOut;
  const buttons = (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={purchase.addToCart}
        className={buttonClass({ variant: "outline", size, block: true, className: "min-w-0" })}
      >
        {m.pd_add_to_cart()}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={purchase.buyNow}
        className={buttonClass({ variant: "primary", size, block: true, className: "min-w-0" })}
      >
        {product.soldOut ? m.product_card_sold_out() : m.pd_buy_now()}
      </button>
    </>
  );
  if (inline) return buttons;
  return <div className="grid grid-cols-2 gap-2">{buttons}</div>;
}

/** 찜 토글 — 비회원은 로그인으로 보낸다. 상단 구매 영역과 모바일 하단 막대가 같이 쓴다 */
export function useWishToggle() {
  const navigate = useNavigate();
  const { product, wished, setWished } = usePurchase();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const toggle = () => {
    setPending(true);
    setMessage(null);
    void toggleWish({ data: { productId: product.productId, wish: !wished } })
      .then(async (result) => {
        if (result.loginRequired) {
          await navigate({
            to: "/login",
            search: { redirectTo: `/products/${productPathParam(product)}` },
          });
          return;
        }
        if (result.wished === null) setMessage(m.pd_wish_failed());
        else setWished(result.wished);
      })
      .finally(() => setPending(false));
  };
  return { wished, pending, message, setMessage, toggle };
}

export function HeartIcon({
  filled,
  className = "size-5",
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <Heart
      aria-hidden="true"
      strokeWidth={1.6}
      className={`${className} ${filled ? "fill-ink text-ink" : ""}`}
    />
  );
}

/** 찜 정사각 버튼(56px) — 접근성 이름이 찜하기/찜 해제다 */
function WishSquare({ wish }: { wish: ReturnType<typeof useWishToggle> }) {
  return (
    <button
      type="button"
      aria-label={wish.wished ? m.pd_wished() : m.pd_wish()}
      aria-pressed={wish.wished}
      disabled={wish.pending}
      onClick={wish.toggle}
      className="flex size-14 items-center justify-center border border-line-strong bg-page hover:border-ink disabled:opacity-50"
    >
      <HeartIcon filled={wish.wished} className="size-[1.375rem]" />
    </button>
  );
}

/** 문의하기·공유하기 — 작은 글자 링크 줄. 공유는 주소를 복사한다 */
export function PurchaseLinks({ onInquiry }: { onInquiry?: () => void }) {
  const [message, setMessage] = useState<string | null>(null);
  const link = "flex items-center gap-1 text-meta text-sub hover:text-ink";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center gap-4">
        <button type="button" onClick={onInquiry} className={link}>
          <MessageCircle aria-hidden="true" className="size-4" strokeWidth={1.6} />
          {m.pd_inquiry()}
        </button>
        <span aria-hidden="true" className="h-3 w-px bg-line" />
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            navigator.clipboard
              .writeText(window.location.href)
              .then(() => setMessage(m.pd_share_copied()))
              .catch(() => setMessage(m.pd_share_failed()));
          }}
          className={link}
        >
          <Share2 aria-hidden="true" className="size-4" strokeWidth={1.6} />
          {m.pd_share()}
        </button>
      </div>
      {message ? (
        <p role="status" className="text-center text-meta">
          {message}
        </p>
      ) : null}
    </div>
  );
}
