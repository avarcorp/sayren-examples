import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import { AmountSummary } from "../components/amount-summary";
import { LineItem } from "../components/line-item";
import { Button, Container, EmptyState, ErrorText, LinkButton, PageTitle } from "../components/ui";
import { useCart } from "../hooks/use-account";
import { useStore } from "../hooks/use-catalog";
import { lazyMessages, m } from "../i18n";
import { cartQuery } from "../lib/account-queries";
import { checkoutFromCart, removeCartItem, updateCartQuantity } from "../lib/shop-actions";

const UNPURCHASABLE = lazyMessages<"SOLD_OUT" | "SUSPENDED" | "CLOSED">({
  SOLD_OUT: () => m.cart_sold_out(),
  SUSPENDED: () => m.cart_suspended(),
  CLOSED: () => m.cart_closed(),
});

/** 장바구니 — 줄(용량·분쇄도)·수량·삭제, 합계는 서버 summary 그대로. 구매할 수 없는 줄은 사유를 보이고 주문에서 뺀다 */
export const Route = createFileRoute("/cart")({
  loader: ({ context }) => context.queryClient.ensureQueryData(cartQuery()),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const store = useStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const purchasable = cart.items.filter((item) => item.purchasable);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["cart"] });
  const run = async (action: () => Promise<{ ok: boolean; message?: string }>) => {
    setPending(true);
    const result = await action();
    setPending(false);
    if (!result.ok) return setError(result.message ?? null);
    setError(null);
    await refresh();
  };

  const order = async () => {
    setPending(true);
    const result = await checkoutFromCart({
      data: { cartItemIds: purchasable.map((item) => item.cartItemId) },
    });
    setPending(false);
    if (!result.ok) return setError(result.message);
    await navigate({ to: "/checkout", search: { id: result.data.checkoutId } });
  };

  if (cart.items.length === 0) {
    return (
      <Container className="pt-5">
        <PageTitle>{m.cart_title()}</PageTitle>
        <EmptyState
          message={m.cart_empty()}
          action={
            <LinkButton to="/products" variant="secondary">
              {m.cart_browse()}
            </LinkButton>
          }
        />
      </Container>
    );
  }

  return (
    <Container className="flex flex-col gap-5 pt-5 pb-24 md:pb-0">
      <PageTitle>{m.cart_title()}</PageTitle>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_20rem]">
        <ul className="flex flex-col">
          {cart.items.map((item) => (
            <li key={item.cartItemId} className="border-line border-b py-4 first:pt-0">
              <LineItem
                name={item.productName}
                thumbnailUrl={item.thumbnailUrl}
                optionName={item.optionName}
                customInputs={item.customInputs}
                quantity={item.quantity}
                totalPrice={item.totalPrice}
                currency={item.currency}
                aside={
                  <button
                    type="button"
                    aria-label={m.cart_remove()}
                    className="-mt-2 -mr-2 grid size-11 shrink-0 place-items-center text-muted"
                    disabled={pending}
                    onClick={() =>
                      run(() => removeCartItem({ data: { cartItemId: item.cartItemId } }))
                    }
                  >
                    <X className="size-4" />
                  </button>
                }
              >
                {item.purchasable ? (
                  <div className="mt-1 flex w-fit items-center rounded-control border border-line-strong">
                    <button
                      type="button"
                      aria-label={m.quantity_decrease()}
                      className="grid size-11 place-items-center disabled:text-muted"
                      disabled={pending || item.quantity <= 1}
                      onClick={() =>
                        run(() =>
                          updateCartQuantity({
                            data: { cartItemId: item.cartItemId, quantity: item.quantity - 1 },
                          }),
                        )
                      }
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-8 text-center text-body tabular">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={m.quantity_increase()}
                      className="grid size-11 place-items-center"
                      disabled={pending}
                      onClick={() =>
                        run(() =>
                          updateCartQuantity({
                            data: { cartItemId: item.cartItemId, quantity: item.quantity + 1 },
                          }),
                        )
                      }
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                ) : (
                  <p className="font-semibold text-meta text-sale">
                    {item.unpurchasableReason
                      ? UNPURCHASABLE[item.unpurchasableReason]
                      : m.cart_sold_out()}
                  </p>
                )}
              </LineItem>
            </li>
          ))}
        </ul>
        <aside className="flex flex-col gap-4">
          <AmountSummary
            currency={cart.summary.currency}
            productAmount={cart.summary.productAmount}
            deliveryFee={cart.summary.deliveryFee}
            totalAmount={cart.summary.totalAmount}
          />
          {error ? <ErrorText>{error}</ErrorText> : null}
          <div className="hidden md:block">
            <Button
              className="w-full"
              disabled={pending || purchasable.length === 0 || !store.checkoutAvailable}
              onClick={order}
            >
              {m.cart_order()}
            </Button>
          </div>
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-line border-t bg-page px-4 py-2 md:hidden">
        <Button
          className="w-full"
          disabled={pending || purchasable.length === 0 || !store.checkoutAvailable}
          onClick={order}
        >
          {m.cart_order_total({ count: purchasable.length })}
        </Button>
      </div>
    </Container>
  );
}
