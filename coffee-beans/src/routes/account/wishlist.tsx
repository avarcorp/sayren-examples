import { createFileRoute } from "@tanstack/react-router";
import { AccountLayout } from "../../components/account/account-layout";
import { ProductGrid } from "../../components/product-card";
import { EmptyState, LinkButton } from "../../components/ui";
import { useWishlist } from "../../hooks/use-account";
import { m } from "../../i18n";
import { wishlistQuery } from "../../lib/account-queries";
import { requireMember } from "../../lib/guards";

/** 찜 목록 */
export const Route = createFileRoute("/account/wishlist")({
  beforeLoad: requireMember,
  loader: ({ context }) => context.queryClient.ensureQueryData(wishlistQuery()),
  component: Wishlist,
});

function Wishlist() {
  const wishlist = useWishlist();
  return (
    <AccountLayout title={m.account_menu_wishlist()}>
      {wishlist.contents.length === 0 ? (
        <EmptyState
          message={m.wishlist_empty()}
          action={
            <LinkButton to="/products" variant="secondary">
              {m.cart_browse()}
            </LinkButton>
          }
        />
      ) : (
        <ProductGrid products={wishlist.contents} />
      )}
    </AccountLayout>
  );
}
