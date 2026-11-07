import type { ProductDetail } from "@sayren/storefront-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useState } from "react";
import { useSession, useWishlisted } from "../../hooks/use-account";
import { useAction } from "../../hooks/use-action";
import { useStore } from "../../hooks/use-catalog";
import { m } from "../../i18n";
import { cartQuery, wishlistQuery } from "../../lib/account-queries";
import { parseCameraName } from "../../lib/camera-name";
import { formatMoney } from "../../lib/format";
import { productPathParam } from "../../lib/product-path";
import { addToCart, buyNow, setWishlist } from "../../lib/shop-actions";
import { DeliveryNotice } from "../delivery-notice";
import { CheckMark, GradeBadge } from "../marks";
import { Price } from "../price";
import { Button } from "../ui";

/** 상품 요약과 구매 상자 — 데스크톱은 오른쪽 열에 붙어 따라오고, 모바일은 아래 고정 구매 바가 같은 버튼을 쓴다 */
export function PurchaseBox({ product }: { product: ProductDetail }) {
  const { grade, base } = parseCameraName(product.name);
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <nav aria-label={m.nav_categories()} className="text-meta text-sub">
        {product.categoryPath.map((c) => c.name).join(" / ")}
      </nav>
      <div className="flex flex-col gap-3">
        {grade ? <GradeBadge grade={grade} /> : null}
        <h1 className="break-words font-bold text-2xl leading-snug tracking-tight">
          {grade ? base : product.name}
        </h1>
        {product.soldOut ? (
          <p className="font-bold text-2xl text-muted">{m.product_sold_out()}</p>
        ) : (
          <Price product={product} size="detail" />
        )}
        {product.purchasePoint ? (
          <p className="text-body text-sub">
            {m.product_purchase_point({
              amount: formatMoney(product.purchasePoint, product.currency),
            })}
          </p>
        ) : null}
      </div>
      <ul className="flex flex-col gap-2 border-line border-y py-4 text-body">
        <li className="flex items-center gap-2">
          <CheckMark size={16} muted={product.soldOut} />
          {m.product_inspected()}
        </li>
        <li>
          <DeliveryNotice product={product} />
        </li>
        <li className="text-sub">{m.product_return_period({ days: product.returnPeriodDays })}</li>
      </ul>
      <div className="hidden lg:block">
        <PurchaseActions product={product} />
      </div>
    </div>
  );
}

/** 구매 버튼 묶음 — 바로 구매·담기·찜. 판매 완료면 비활성, 주문을 받지 않는 상점이면 안내 */
export function PurchaseActions({
  product,
  compact = false,
}: {
  product: ProductDetail;
  compact?: boolean;
}) {
  const store = useStore();
  const session = useSession();
  const wishlisted = useWishlisted(product.productId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();
  const [added, setAdded] = useState(false);

  if (!store.checkoutAvailable) {
    return (
      <p className="text-body text-sub">
        {m.checkout_unavailable()}
        {store.customerCenterPhone
          ? ` · ${m.checkout_unavailable_phone({ phone: store.customerCenterPhone })}`
          : null}
      </p>
    );
  }
  const variant = product.variants[0];
  const disabled =
    product.soldOut || !product.availableInMarket || !variant || variant.soldOut || pending;
  const line = { productId: product.productId, optionId: variant?.variantId ?? "" };

  const addToCartClick = async () => {
    const result = await run(() => addToCart({ data: line }));
    if (result.ok) {
      setAdded(true);
      await queryClient.invalidateQueries({ queryKey: cartQuery().queryKey });
    }
  };
  const buyNowClick = async () => {
    const result = await run(() => buyNow({ data: line }));
    if (result.ok) await navigate({ to: "/checkout", search: { id: result.data.checkoutId } });
  };
  const wishlistClick = async () => {
    if (!session) {
      await navigate({
        to: "/login",
        search: { redirect: `/products/${productPathParam(product)}` },
      });
      return;
    }
    const result = await run(() =>
      setWishlist({ data: { productId: product.productId, on: !wishlisted } }),
    );
    if (result.ok) await queryClient.invalidateQueries({ queryKey: wishlistQuery().queryKey });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className={`flex gap-2 ${compact ? "" : "flex-wrap"}`}>
        <Button
          variant="secondary"
          className="!px-0 w-12 shrink-0"
          aria-label={wishlisted ? m.product_wishlist_remove() : m.product_wishlist_add()}
          aria-pressed={wishlisted}
          onClick={wishlistClick}
        >
          <Heart
            size={20}
            aria-hidden="true"
            className={wishlisted ? "fill-point-strong text-point-strong" : ""}
          />
        </Button>
        <Button
          variant="secondary"
          className="min-w-0 flex-1 !px-2"
          disabled={disabled}
          onClick={addToCartClick}
        >
          {m.product_add_cart()}
        </Button>
        <Button
          className={`min-w-0 !px-2 ${compact ? "flex-1" : "w-full"}`}
          disabled={disabled}
          onClick={buyNowClick}
        >
          {product.soldOut ? m.product_sold_out() : m.product_buy_now()}
        </Button>
      </div>
      <div aria-live="polite" className="text-meta">
        {error ? <p className="text-danger">{error}</p> : null}
        {added && !error ? (
          <p className="text-sub">
            {m.product_added()}{" "}
            <Link to="/cart" className="text-point-strong underline">
              {m.product_go_cart()}
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** 모바일 하단 고정 구매 바(1024px 미만) */
export function StickyBuyBar({ product }: { product: ProductDetail }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-line border-t bg-page px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <PurchaseActions product={product} compact />
    </div>
  );
}
