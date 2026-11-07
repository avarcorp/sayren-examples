import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AmountSummary } from "../components/amount-summary";
import { LineItem } from "../components/line-item";
import { Button, ButtonLink, EmptyState, PageHeader } from "../components/ui";
import { useCart } from "../hooks/use-account";
import { useAction } from "../hooks/use-action";
import { lazyMessages, m } from "../i18n";
import { cartQuery } from "../lib/account-queries";
import { formatMoney } from "../lib/format";
import { productPathParam } from "../lib/product-path";
import { checkoutFromCart, removeCartItem } from "../lib/shop-actions";

const UNPURCHASABLE = lazyMessages({
  SOLD_OUT: () => m.cart_unpurchasable_SOLD_OUT(),
  SUSPENDED: () => m.cart_unpurchasable_SUSPENDED(),
  CLOSED: () => m.cart_unpurchasable_CLOSED(),
});

export const Route = createFileRoute("/cart")({
  loader: ({ context }) => context.queryClient.ensureQueryData(cartQuery()),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const hasBlocked = cart.items.some((item) => !item.purchasable);
  const purchasable = cart.items.filter((item) => item.purchasable);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();

  const remove = async (cartItemId: string) => {
    const result = await run(() => removeCartItem({ data: { cartItemId } }));
    if (result.ok) await queryClient.invalidateQueries({ queryKey: cartQuery().queryKey });
  };
  const order = async () => {
    const result = await run(() =>
      checkoutFromCart({ data: { cartItemIds: purchasable.map((item) => item.cartItemId) } }),
    );
    if (result.ok) await navigate({ to: "/checkout", search: { id: result.data.checkoutId } });
  };

  if (cart.items.length === 0) {
    return (
      <main className="flex flex-col gap-6">
        <PageHeader title={m.cart_title()} />
        <EmptyState
          message={m.cart_empty()}
          action={
            <ButtonLink to="/products" variant="secondary">
              {m.cart_go_shopping()}
            </ButtonLink>
          }
        />
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6 pb-24 lg:pb-0">
      <PageHeader title={m.cart_title()} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-label={m.checkout_items()} className="flex flex-col">
          <ul className="divide-y divide-line border-line border-b">
            {cart.items.map((item) => (
              <li key={item.cartItemId}>
                <LineItem
                  name={item.productName}
                  thumbnailUrl={item.thumbnailUrl}
                  quantity={item.quantity}
                  totalPrice={item.totalPrice}
                  currency={item.currency}
                  muted={!item.purchasable}
                  link={{
                    to: "/products/$productId",
                    params: { productId: productPathParam(item) },
                  }}
                  aside={
                    <button
                      type="button"
                      onClick={() => remove(item.cartItemId)}
                      disabled={pending}
                      aria-label={m.cart_remove_label({ name: item.productName })}
                      className="-mt-2 -mr-2 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center text-meta text-sub underline"
                    >
                      {m.cart_remove()}
                    </button>
                  }
                >
                  {item.unpurchasableReason ? (
                    <p className="font-semibold text-meta text-danger">
                      {UNPURCHASABLE[item.unpurchasableReason]}
                    </p>
                  ) : null}
                </LineItem>
              </li>
            ))}
          </ul>
          {hasBlocked ? (
            <p className="pt-3 text-meta text-sub">{m.cart_unpurchasable_note()}</p>
          ) : null}
          {error ? (
            <p role="alert" className="pt-3 text-meta text-danger">
              {error}
            </p>
          ) : null}
        </section>
        <aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
          <AmountSummary amounts={cart.summary} currency={cart.summary.currency} />
          <div className="hidden lg:block">
            <Button
              className="w-full"
              disabled={purchasable.length === 0 || pending}
              onClick={order}
            >
              {m.cart_order({
                amount: formatMoney(cart.summary.totalAmount, cart.summary.currency),
              })}
            </Button>
          </div>
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-line border-t bg-page px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <Button className="w-full" disabled={purchasable.length === 0 || pending} onClick={order}>
          {m.cart_order({ amount: formatMoney(cart.summary.totalAmount, cart.summary.currency) })}
        </Button>
      </div>
    </main>
  );
}
