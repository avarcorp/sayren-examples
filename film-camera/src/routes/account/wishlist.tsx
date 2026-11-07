import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AccountLayout } from "../../components/account/account-layout";
import { ProductGrid } from "../../components/product-card";
import { ButtonLink, EmptyState } from "../../components/ui";
import { m } from "../../i18n";
import { wishlistQuery } from "../../lib/account-queries";
import { requireMember } from "../../lib/guards";

export const Route = createFileRoute("/account/wishlist")({
  beforeLoad: requireMember,
  loader: ({ context }) => context.queryClient.ensureQueryData(wishlistQuery()),
  component: Wishlist,
});

function Wishlist() {
  const wishlist = useSuspenseQuery(wishlistQuery()).data;
  return (
    <AccountLayout title={m.wishlist_title()}>
      {wishlist.contents.length === 0 ? (
        <EmptyState
          message={m.wishlist_empty()}
          action={
            <ButtonLink to="/products" variant="secondary">
              {m.cart_go_shopping()}
            </ButtonLink>
          }
        />
      ) : (
        <ProductGrid products={wishlist.contents} />
      )}
    </AccountLayout>
  );
}
