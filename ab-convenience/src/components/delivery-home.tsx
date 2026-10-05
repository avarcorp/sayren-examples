import type { Cart, PickupLocationView, ProductCard } from "@sayren/storefront-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import {
  Clock,
  Cookie,
  CupSoda,
  MapPin,
  Minus,
  Plus,
  Sandwich,
  ShoppingBasket,
  Soup,
  Store,
} from "lucide-react";
import { useState } from "react";
import { m } from "../i18n";
import { formatPrice } from "../lib/format";
import { changeHomeCart } from "../lib/home-cart";
import { priceView } from "../lib/price";
import { productPathParam } from "../lib/product-path";
import { useReceiveMethod } from "../lib/receive-method";
import type { RootData } from "../routes/__root";
import { useStoreName } from "../site/site-link";
import { CART_COUNT_KEY } from "./browse/cart-count";
import { ProductThumb } from "./product-thumb";
import { ReceiveMethodToggle } from "./receive-method-toggle";

export type HomeProduct = ProductCard & { categoryId: string; categoryName: string };

/** 카테고리 아이콘 — 이름에 맞는 것이 없으면 장바구니 아이콘 */
function CategoryIcon({ name }: { name: string }) {
  const props = { size: 26, strokeWidth: 1.8, "aria-hidden": true } as const;
  if (/음료|커피|우유/.test(name)) return <CupSoda {...props} />;
  if (/라면|면|국/.test(name)) return <Soup {...props} />;
  if (/과자|스낵|디저트/.test(name)) return <Cookie {...props} />;
  if (/간편식|도시락|김밥|식사/.test(name)) return <Sandwich {...props} />;
  return <ShoppingBasket {...props} />;
}

const TINTS = ["bg-amber-100", "bg-blue-100", "bg-red-100", "bg-violet-100", "bg-emerald-100"];

/**
 * 배달앱 홈 — 받는 방법, 가게 카드(영업시간·배달팁 또는 픽업 장소), 카테고리, 상품 목록(바로 담기·수량), 장바구니 바.
 * 값은 모두 API에서 온다: 영업시간은 상점 `businessHours` 문구, 배달팁은 배송 상품의 기본 배송비, 픽업 장소는 `GET /pickup-locations`.
 */
export function DeliveryHome({
  categories,
  products,
  pickupLocations,
  deliveryFee,
  cart,
}: {
  categories: { categoryId: string; name: string }[];
  products: HomeProduct[];
  pickupLocations: PickupLocationView[];
  deliveryFee: { fee: number; freeOver: number | null } | null;
  cart: Cart | null;
}) {
  const storeName = useStoreName();
  const contact = useRouterState({
    select: (state) => (state.matches[0]?.loaderData as RootData | undefined)?.contact ?? null,
  });
  const method = useReceiveMethod();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 상품의 장바구니 줄이 하나일 때만 홈에서 수량을 바꾼다(옵션·추가 선택이 갈린 줄은 장바구니에서 바꾼다)
  const lineOf = (productId: string) => {
    const lines = cart?.items.filter((item) => item.productId === productId) ?? [];
    return lines.length === 1 ? (lines[0] ?? null) : null;
  };
  const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const change = (product: HomeProduct, delta: 1 | -1) => {
    const line = lineOf(product.productId);
    const data = line
      ? { intent: "set" as const, cartItemId: line.cartItemId, quantity: line.quantity + delta }
      : { intent: "add" as const, productId: product.productId };
    setBusy(product.productId);
    setError(null);
    changeHomeCart({ data })
      .then(async (result) => {
        if (result.needsOptions) {
          await navigate({
            to: "/products/$productId",
            params: { productId: productPathParam(product) },
          });
          return;
        }
        if (result.error) setError(result.error);
        await Promise.all([
          router.invalidate(),
          queryClient.invalidateQueries({ queryKey: CART_COUNT_KEY }),
        ]);
      })
      .finally(() => setBusy(null));
  };

  const shown = categoryId
    ? products.filter((product) => product.categoryId === categoryId)
    : products;
  const activeName = categories.find((c) => c.categoryId === categoryId)?.name;
  const pickup = pickupLocations[0] ?? null;

  return (
    <div className="-mx-4 -mt-8 flex flex-col gap-3 bg-ground px-4 pt-3 pb-28 md:mx-0 md:mt-0 md:rounded-card md:p-6 md:pb-6">
      <ReceiveMethodToggle value={method} />

      <section
        aria-label={m.home_store_info()}
        className="flex flex-col gap-3 rounded-card bg-page p-4"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-control bg-brand text-white">
            <Store size={22} aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="truncate font-extrabold text-lg">{storeName}</h1>
            {contact?.businessHours ? (
              <span className="flex items-center gap-1 text-caption text-sub">
                <Clock size={13} aria-hidden />
                {m.home_business_hours({ hours: contact.businessHours })}
              </span>
            ) : null}
          </div>
        </div>
        {method === "DIRECT" ? (
          deliveryFee ? (
            <dl className="flex items-center justify-between border-line border-t pt-3 text-body">
              <dt className="text-sub">{m.home_delivery_fee()}</dt>
              <dd className="font-bold">
                {deliveryFee.fee === 0
                  ? m.home_delivery_fee_free()
                  : deliveryFee.freeOver
                    ? m.home_delivery_fee_conditional({
                        fee: formatPrice(deliveryFee.fee),
                        over: formatPrice(deliveryFee.freeOver),
                      })
                    : formatPrice(deliveryFee.fee)}
              </dd>
            </dl>
          ) : null
        ) : (
          <dl className="flex items-start justify-between gap-3 border-line border-t pt-3 text-body">
            <dt className="flex shrink-0 items-center gap-1 text-sub">
              <MapPin size={15} aria-hidden />
              {m.home_pickup_location()}
            </dt>
            <dd className="flex min-w-0 flex-col items-end gap-0.5 text-right">
              {pickup ? (
                <>
                  <span className="font-bold">{pickup.name}</span>
                  <span className="text-caption text-sub">{pickup.address}</span>
                  {pickupLocations.length > 1 ? (
                    <span className="text-caption text-sub">
                      {m.home_pickup_more({ count: pickupLocations.length - 1 })}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="text-sub">{m.home_pickup_at_store()}</span>
              )}
            </dd>
          </dl>
        )}
      </section>

      {categories.length ? (
        <nav aria-label={m.home_categories()} className="grid grid-cols-4 gap-2">
          {categories.slice(0, 8).map((category, index) => {
            const on = category.categoryId === categoryId;
            return (
              <button
                key={category.categoryId}
                type="button"
                aria-pressed={on}
                onClick={() => setCategoryId(on ? null : category.categoryId)}
                className={`flex flex-col items-center gap-1.5 rounded-card border-[1.5px] py-2.5 ${
                  on ? "border-brand bg-page" : "border-transparent"
                }`}
              >
                <span
                  className={`flex size-12 items-center justify-center rounded-full text-brand-strong ${TINTS[index % TINTS.length]}`}
                >
                  <CategoryIcon name={category.name} />
                </span>
                <span className="font-bold text-meta">{category.name}</span>
              </button>
            );
          })}
        </nav>
      ) : null}

      <section
        aria-labelledby="home-list"
        className="flex flex-col rounded-card bg-page px-4 pt-4 pb-1"
      >
        <div className="flex items-center justify-between">
          <h2 id="home-list" className="font-extrabold text-lg">
            {activeName ?? m.home_all_products()}
          </h2>
          <Link
            to="/products"
            search={categoryId ? { categoryId } : {}}
            className="flex min-h-11 items-center text-meta text-sub"
          >
            {m.home_see_all()}
          </Link>
        </div>
        {error ? (
          <p role="alert" className="pb-2 text-meta text-point">
            {error}
          </p>
        ) : null}
        {shown.length ? (
          <ul className="flex flex-col">
            {shown.map((product, index) => {
              const line = lineOf(product.productId);
              const { price, compareAt, rate } = priceView(product);
              const to = {
                to: "/products/$productId" as const,
                params: { productId: productPathParam(product) },
              };
              const pending = busy === product.productId;
              return (
                <li
                  key={product.productId}
                  className="flex items-center gap-3.5 border-line border-t py-3"
                >
                  <Link {...to} className="shrink-0" aria-label={product.name}>
                    <ProductThumb
                      src={product.thumbnailUrl}
                      alt=""
                      loading={index < 4 ? "eager" : "lazy"}
                      className={`size-21 rounded-control object-cover ${product.thumbnailUrl ? "" : TINTS[categories.findIndex((c) => c.categoryId === product.categoryId) % TINTS.length]}`}
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-caption text-sub">{product.categoryName}</span>
                    <Link {...to} className="line-clamp-2 font-bold text-body-lg leading-snug">
                      {product.name}
                    </Link>
                    <span className="flex items-baseline gap-1.5">
                      {rate ? <span className="font-bold text-point">{rate}%</span> : null}
                      <span className="tabular font-extrabold text-base">{formatPrice(price)}</span>
                      {compareAt ? (
                        <span className="tabular text-caption text-muted line-through">
                          {formatPrice(compareAt)}
                        </span>
                      ) : null}
                    </span>
                  </div>
                  {product.soldOut ? (
                    <span className="shrink-0 rounded-full bg-chip px-3 py-1.5 font-bold text-caption text-muted">
                      {m.home_sold_out()}
                    </span>
                  ) : line ? (
                    <div className="flex h-11 shrink-0 items-center rounded-full bg-brand text-white">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => change(product, -1)}
                        aria-label={m.home_minus({ name: product.name })}
                        className="flex h-11 w-10 items-center justify-center disabled:opacity-60"
                      >
                        <Minus size={18} strokeWidth={2.6} aria-hidden />
                      </button>
                      <span
                        aria-live="polite"
                        className="tabular min-w-5 text-center font-extrabold"
                      >
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => change(product, 1)}
                        aria-label={m.home_plus({ name: product.name })}
                        className="flex h-11 w-10 items-center justify-center disabled:opacity-60"
                      >
                        <Plus size={18} strokeWidth={2.6} aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => change(product, 1)}
                      aria-label={m.home_add({ name: product.name })}
                      className="flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line-strong bg-page text-brand disabled:opacity-60"
                    >
                      <Plus size={20} strokeWidth={2.6} aria-hidden />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-10 text-center text-meta text-sub">{m.home_empty()}</p>
        )}
      </section>

      {count > 0 && cart ? (
        <div className="fixed inset-x-0 bottom-16 z-30 px-4 pb-3 md:static md:p-0">
          <Link
            to="/cart"
            className="mx-auto flex h-14 max-w-page items-center justify-between rounded-card bg-brand px-4.5 text-white shadow-[0_6px_18px_rgba(21,128,61,0.28)]"
          >
            <span className="flex items-center gap-2.5">
              <span className="tabular flex h-6.5 min-w-6.5 items-center justify-center rounded-full bg-page px-1.5 font-extrabold text-brand text-meta">
                {count}
              </span>
              <span className="font-bold text-base">{m.home_view_cart()}</span>
            </span>
            <span className="tabular font-extrabold text-base">
              {formatPrice(cart.summary.productAmount)}
            </span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
