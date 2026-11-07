import type { CartItem } from "@sayren/storefront-sdk";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState } from "react";
import { ProductImage } from "../components/product/product-image";
import { Button, ButtonLink } from "../components/ui/button";
import { EmptyState } from "../components/ui/empty-state";
import { MoneyRow, SummaryBox } from "../components/ui/money";
import { Container, PageTitle } from "../components/ui/page-title";
import { QuantityStepper } from "../components/ui/quantity-stepper";
import { lazyMessages, m } from "../i18n";
import { checkoutFromCart, removeCartItem, updateCartItem } from "../lib/account-actions";
import { cartQuery } from "../lib/account-queries";
import { formatMoney } from "../lib/format";
import { productPathParam } from "../lib/product-path";

const UNPURCHASABLE = lazyMessages<NonNullable<CartItem["unpurchasableReason"]>>({
  SOLD_OUT: () => m.cart_reason_sold_out(),
  SUSPENDED: () => m.cart_reason_suspended(),
  CLOSED: () => m.cart_reason_closed(),
});

export const Route = createFileRoute("/cart")({
  loader: ({ context }) => context.queryClient.ensureQueryData(cartQuery()),
  head: () => ({ meta: [{ title: m.nav_cart() }] }),
  component: CartPage,
});

function CartPage() {
  const cart = useSuspenseQuery(cartQuery()).data;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const purchasable = cart.items.filter((item) => item.purchasable);

  const refresh = () => queryClient.invalidateQueries({ queryKey: cartQuery().queryKey });

  const order = async () => {
    setPending(true);
    setError(null);
    const result = await checkoutFromCart({
      data: { cartItemIds: purchasable.map((item) => item.cartItemId) },
    }).catch(() => null);
    setPending(false);
    if (result?.ok) await navigate({ to: "/checkout", search: { id: result.checkoutId } });
    else setError(result?.message ?? m.common_error_retry());
  };

  if (cart.items.length === 0) {
    return (
      <Container>
        <PageTitle>{m.nav_cart()}</PageTitle>
        <EmptyState
          message={m.cart_empty()}
          action={<ButtonLink to="/products">{m.cart_go_shopping()}</ButtonLink>}
        />
      </Container>
    );
  }

  return (
    <Container className="pb-28 md:pb-0">
      <PageTitle>{m.nav_cart()}</PageTitle>
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_340px]">
        <ul className="border-line border-t">
          {cart.items.map((item) => (
            <CartRow key={item.cartItemId} item={item} onChange={refresh} onError={setError} />
          ))}
        </ul>
        <div className="flex flex-col gap-3 md:sticky md:top-28 md:self-start">
          <SummaryBox>
            <MoneyRow
              label={m.amount_products()}
              amount={cart.summary.productAmount}
              currency={cart.summary.currency}
            />
            {cart.summary.requiresShipping ? (
              <MoneyRow
                label={m.amount_delivery()}
                amount={cart.summary.deliveryFee}
                currency={cart.summary.currency}
              />
            ) : null}
            <div className="border-line border-t pt-2.5">
              <MoneyRow
                label={m.amount_total()}
                amount={cart.summary.totalAmount}
                currency={cart.summary.currency}
                strong
              />
            </div>
          </SummaryBox>
          {error ? (
            <p role="alert" className="text-meta text-sale">
              {error}
            </p>
          ) : null}
          <div className="fixed inset-x-0 bottom-0 z-30 border-line border-t bg-page p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:border-0 md:p-0">
            <Button
              className="w-full"
              disabled={pending || purchasable.length === 0}
              onClick={order}
            >
              {m.cart_order({
                amount: formatMoney(cart.summary.totalAmount, cart.summary.currency),
              })}
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}

function CartRow({
  item,
  onChange,
  onError,
}: {
  item: CartItem;
  onChange: () => void;
  onError: (message: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const act = async (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setBusy(true);
    const result = await fn().catch(() => null);
    setBusy(false);
    if (result?.ok) {
      onError(null);
      onChange();
    } else onError(result?.message ?? m.common_error_retry());
  };
  const path = productPathParam(item);

  return (
    <li className="flex gap-3 border-line border-b py-4">
      <Link to="/products/$productId" params={{ productId: path }} className="w-20 shrink-0">
        <ProductImage src={item.thumbnailUrl} alt={item.productName} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <Link
            to="/products/$productId"
            params={{ productId: path }}
            className="line-clamp-2 min-w-0 flex-1 break-words text-body hover:underline"
          >
            {item.productName}
          </Link>
          <button
            type="button"
            className="-mt-2 -mr-2 grid size-11 shrink-0 place-items-center text-muted"
            aria-label={m.cart_remove({ name: item.productName })}
            disabled={busy}
            onClick={() => act(() => removeCartItem({ data: { cartItemId: item.cartItemId } }))}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        {item.optionName ? <p className="text-meta text-sub">{item.optionName}</p> : null}
        {!item.purchasable && item.unpurchasableReason ? (
          <p className="text-meta text-sale">{UNPURCHASABLE[item.unpurchasableReason]}</p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <QuantityStepper
            value={item.quantity}
            disabled={busy || !item.purchasable}
            onChange={(quantity) =>
              act(() => updateCartItem({ data: { cartItemId: item.cartItemId, quantity } }))
            }
          />
          <p className="tabular font-semibold text-body">
            {formatMoney(item.totalPrice, item.currency)}
          </p>
        </div>
      </div>
    </li>
  );
}
