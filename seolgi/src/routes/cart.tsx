import type { Cart } from "@sayren/storefront-sdk";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { CartTemplate } from "../components/templates/cart-template";
import { useCartActions } from "../hooks/use-cart-actions";
import { cartQuery } from "../lib/cart";

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/cart")({
  loader: ({ context }) => context.queryClient.ensureQueryData(cartQuery()),
  head: () => ({ meta: [{ title: "장바구니 | 설기로운" }] }),
  staticData: { checkoutStep: 1 },
  component: CartPage,
});

const EMPTY: Cart = {
  items: [],
  summary: {
    currency: "KRW",
    productAmount: 0,
    deliveryFee: 0,
    totalAmount: 0,
    requiresShipping: false,
  },
};

function CartPage() {
  const { data } = useSuspenseQuery(cartQuery());
  const store = rootRoute.useLoaderData({ select: (d) => d.store });
  const cart = data.cart ?? EMPTY;
  return <CartBody cart={cart} loggedIn={data.loggedIn} store={store} />;
}

function CartBody({
  cart,
  loggedIn,
  store,
}: {
  cart: Cart;
  loggedIn: boolean;
  store: { guestCheckout: boolean; checkoutAvailable: boolean } | null;
}) {
  const actions = useCartActions(cart);
  const ordering = store?.checkoutAvailable ?? true;
  const needLogin = !loggedIn && !(store?.guestCheckout ?? true);
  return (
    <CartTemplate
      cart={cart}
      actions={actions}
      cta={{ kind: !ordering ? "closed" : needLogin ? "login" : "order" }}
    />
  );
}
