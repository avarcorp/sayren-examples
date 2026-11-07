import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AccountLayout } from "../components/account/account-layout";
import { ProductGrid } from "../components/product/product-card";
import { ButtonLink } from "../components/ui/button";
import { EmptyState } from "../components/ui/empty-state";
import { m } from "../i18n";
import { wishlistQuery } from "../lib/account-queries";
import { requireMember } from "../lib/require-member";

export const Route = createFileRoute("/account/wishlist")({
  loader: async ({ context }) => {
    await requireMember(context.queryClient, "/account/wishlist");
    return context.queryClient.ensureQueryData(wishlistQuery());
  },
  head: () => ({ meta: [{ title: m.account_wishlist() }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const products = useSuspenseQuery(wishlistQuery()).data;
  return (
    <AccountLayout title={m.account_wishlist()}>
      {products.length === 0 ? (
        <EmptyState
          message={m.wishlist_empty()}
          action={<ButtonLink to="/products">{m.cart_go_shopping()}</ButtonLink>}
        />
      ) : (
        <ProductGrid products={products} />
      )}
    </AccountLayout>
  );
}
