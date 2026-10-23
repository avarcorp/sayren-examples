import type { Cart } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import type { CartActions } from "../../hooks/use-cart-actions";
import { formatMoney } from "../../lib/format";
import { buttonClass } from "../atoms/button";
import { Checkbox } from "../atoms/checkbox";
import { CartLine } from "../molecules/cart-line";
import { SummaryRows } from "../molecules/summary-rows";

export type CartCta = { kind: "closed" } | { kind: "login" } | { kind: "order" };

/** 장바구니 (시안 DCart) — 왼쪽 줄 목록(전체 선택·선택 삭제), 오른쪽 금액 요약과 주문 버튼 */
export function CartTemplate({
  cart,
  actions,
  cta,
}: {
  cart: Cart;
  actions: CartActions;
  cta: CartCta;
}) {
  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 py-32 text-center">
        <h1 className="font-display text-h2">장바구니가 비어 있습니다</h1>
        <Link to="/products" className={buttonClass()}>
          상품 둘러보기
        </Link>
      </div>
    );
  }
  const { summary } = cart;
  const partial = actions.chosen.length < cart.items.length;
  return (
    <div className="flex flex-wrap items-start gap-14 pt-12 pb-16">
      <section className="flex min-w-0 flex-[999_1_640px] flex-col" aria-labelledby="cart-title">
        <div className="flex items-baseline justify-between pb-5">
          <h1 id="cart-title" className="font-display text-page-title">
            장바구니 <span className="text-muted">{cart.items.length}</span>
          </h1>
          <button
            type="button"
            disabled={actions.busy || actions.chosen.length === 0}
            onClick={() => void actions.removeChosen()}
            className="h-11 text-muted text-small underline underline-offset-[3px] disabled:opacity-40"
          >
            선택 삭제
          </button>
        </div>
        <Checkbox
          checked={actions.allPicked}
          onChange={actions.toggleAll}
          className="h-13 border-ink border-t border-b-line border-b text-body"
        >
          전체 선택
        </Checkbox>
        <ul>
          {cart.items.map((item) => (
            <CartLine
              key={item.cartItemId}
              item={item}
              picked={actions.isPicked(item.cartItemId)}
              busy={actions.busy}
              onPick={() => actions.toggle(item.cartItemId)}
              onQuantity={(q) => void actions.setQuantity(item.cartItemId, q)}
              onRemove={() => void actions.remove([item.cartItemId])}
            />
          ))}
        </ul>
        {actions.error ? (
          <p role="alert" className="pt-4 text-primary text-small">
            {actions.error}
          </p>
        ) : null}
      </section>

      <aside className="flex w-full min-w-0 flex-[1_1_340px] md:max-w-[400px] flex-col gap-4 md:pt-[76px]">
        <SummaryRows
          rows={[
            { label: "상품 금액", value: formatMoney(summary.productAmount, summary.currency) },
            {
              label: "배송비",
              value: summary.deliveryFee
                ? formatMoney(summary.deliveryFee, summary.currency)
                : "무료",
            },
          ]}
          totalLabel="결제 예정 금액"
          total={formatMoney(summary.totalAmount, summary.currency)}
        />
        <p className="text-muted text-small">
          {partial
            ? "고른 상품의 금액은 주문서에서 다시 계산합니다. 쿠폰과 적립금은 주문서에서 적용합니다"
            : "쿠폰과 적립금은 주문서에서 적용합니다"}
        </p>
        {cta.kind === "closed" ? (
          <p className="bg-tone-plain p-4 text-body">지금은 주문을 받지 않습니다.</p>
        ) : cta.kind === "login" ? (
          <Link
            to="/login"
            search={{ redirectTo: "/cart" }}
            className={buttonClass({ size: "lg", block: true })}
          >
            로그인하고 주문하기
          </Link>
        ) : (
          <Link
            to="/checkout"
            search={{ cartItemId: actions.chosen.map((i) => i.cartItemId) }}
            disabled={actions.chosen.length === 0}
            className={`${buttonClass({ size: "lg", block: true })} ${actions.chosen.length === 0 ? "pointer-events-none opacity-40" : ""}`}
          >
            {actions.chosen.length}개 주문하기
          </Link>
        )}
      </aside>
    </div>
  );
}
