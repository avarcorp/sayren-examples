import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useHydrated, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { CART_COUNT_KEY } from "../components/browse/cart-count";
import { CheckoutSteps } from "../components/checkout/checkout-steps";
import { LineOptions } from "../components/line-options";
import { OrderingNotice, useOrdering } from "../components/ordering-notice";
import { ProductThumb } from "../components/product-thumb";
import { buttonClass, choiceClass } from "../components/ui/button";
import { EmptyState, PageTitle, SectionCard } from "../components/ui/section";
import { m } from "../i18n";
import { apiFor } from "../lib/api.server";
import { readCartToken, writeCartToken } from "../lib/cart-session.server";
import { formatPrice } from "../lib/format";
import { pageTitle } from "../lib/page-title";
import { productPathParam } from "../lib/product-path";
import { readToken } from "../lib/session.server";

const getCart = createServerFn({ method: "GET" }).handler(async () => {
  const accessToken = readToken();
  const cartToken = readCartToken();
  // 비회원이 아직 장바구니를 만든 적이 없으면 서버에 물어볼 것이 없다
  if (!accessToken && !cartToken) {
    return {
      cart: {
        items: [],
        summary: { productAmount: 0, deliveryFee: 0, totalAmount: 0, requiresShipping: true },
      },
      loginRequired: false,
      myCouponCount: null,
    };
  }
  const api = apiFor({ accessToken, cartToken });
  // 회원만 주문받는 상점이면 비회원에게 주문 버튼 대신 로그인 안내를 보인다(담기는 그대로 된다)
  // 회원이면 보유 쿠폰 수(서버 값)를 함께 받는다 — 쿠폰은 주문서에서 적용한다
  const [cart, store, myCoupons] = await Promise.all([
    api.cart.get(),
    accessToken ? null : api.store.get(),
    accessToken ? api.me.coupons({ status: "available" }).catch(() => null) : null,
  ]);
  return {
    cart,
    loginRequired: store ? !store.guestCheckout : false,
    myCouponCount: myCoupons ? myCoupons.length : null,
  };
});

const changeCart = createServerFn({ method: "POST" })
  .validator(
    z.discriminatedUnion("intent", [
      z.object({ intent: z.literal("remove"), cartItemId: z.string() }),
      z.object({
        intent: z.literal("update"),
        cartItemId: z.string(),
        quantity: z.number().int().min(1).max(999),
      }),
    ]),
  )
  .handler(async ({ data }) => {
    const cartToken = readCartToken();
    let issued: string | null = null;
    const api = apiFor({
      accessToken: readToken(),
      cartToken,
      onCartToken: (token) => {
        issued = token;
      },
    });
    if (data.intent === "remove") await api.cart.removeItem(data.cartItemId);
    else await api.cart.updateItem(data.cartItemId, { quantity: data.quantity });
    const token = issued ?? cartToken;
    if (token) writeCartToken(token);
  });

export const Route = createFileRoute("/cart")({
  loader: () => getCart(),
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, m.cart_title()) }] }),
  component: CartPage,
});

function CartPage() {
  const { cart, loginRequired, myCouponCount } = Route.useLoaderData();
  const ordering = useOrdering();
  const router = useRouter();
  const hydrated = useHydrated();
  const queryClient = useQueryClient();
  /** 장바구니를 바꾼 뒤 — 화면 데이터와 헤더 장바구니 배지를 함께 다시 받는다 */
  const refresh = () =>
    Promise.all([router.invalidate(), queryClient.invalidateQueries({ queryKey: CART_COUNT_KEY })]);
  const [pending, setPending] = useState(false);
  /** 고르지 않은 줄 — 기본은 모두 고른 상태다. 줄이 지워지거나 새로 담겨도 「고르지 않음」만 기억하면 새 줄은 골라진다 */
  const [unchecked, setUnchecked] = useState<ReadonlySet<string>>(new Set());

  const change = (data: Parameters<typeof changeCart>[0]["data"]) => {
    setPending(true);
    changeCart({ data })
      .then(refresh)
      .finally(() => setPending(false));
  };

  /** 고른 줄을 지운다 — 장바구니 API는 줄 하나씩 지우므로 차례로 부른다 */
  const removeSelected = (ids: string[]) => {
    if (!ids.length) return;
    setPending(true);
    ids
      .reduce<Promise<unknown>>(
        (previous, cartItemId) =>
          previous.then(() => changeCart({ data: { intent: "remove", cartItemId } })),
        Promise.resolve(),
      )
      .then(refresh)
      .finally(() => setPending(false));
  };

  if (!cart.items.length) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <PageTitle>{m.cart_title()}</PageTitle>
          <CheckoutSteps current="cart" />
        </div>
        <EmptyState
          icon={<ShoppingBag aria-hidden="true" className="size-12" strokeWidth={1.2} />}
          title={m.cart_empty()}
          description={m.cart_empty_description()}
          action={
            <Link to="/products" className={buttonClass({ variant: "primary", size: "md" })}>
              {m.cart_browse_products()}
            </Link>
          }
        />
      </div>
    );
  }

  const purchasable = cart.items.filter((item) => item.purchasable);
  const selected = purchasable.filter((item) => !unchecked.has(item.cartItemId));
  const allSelected = selected.length === purchasable.length && purchasable.length > 0;
  /** 「선택 삭제」 대상 — 고른 줄이다(살 수 없는 줄은 고를 수 없어 줄마다 X로 지운다) */
  const selectedIds = selected.map((item) => item.cartItemId);

  const toggle = (cartItemId: string, checked: boolean) => {
    setUnchecked((current) => {
      const next = new Set(current);
      if (checked) next.delete(cartItemId);
      else next.add(cartItemId);
      return next;
    });
  };

  /**
   * 주문 버튼 — 금액은 서버의 장바구니 합계만 보인다. 일부만 고르면 합계를 화면에서 다시 계산하지 않고 주문서에서 확인한다.
   * 주문 조건은 URL에 둔다 — 새로고침·뒤로가기가 그대로 동작한다
   */
  const orderAction = (className: string) =>
    !ordering.open ? (
      <OrderingNotice ordering={ordering} />
    ) : loginRequired ? (
      <div className="flex flex-col gap-2">
        <p className="text-center text-caption text-muted">{m.cart_members_only()}</p>
        <Link
          to="/login"
          search={{ redirectTo: "/cart" }}
          className={buttonClass({ variant: "primary", size: "lg", block: true, className })}
        >
          {m.cart_login_to_order()}
        </Link>
      </div>
    ) : selected.length ? (
      <Link
        to="/checkout"
        search={{ cartItemId: selected.map((item) => item.cartItemId) }}
        className={buttonClass({ variant: "primary", size: "lg", block: true, className })}
      >
        {allSelected
          ? m.cart_order_amount({ amount: formatPrice(cart.summary.totalAmount) })
          : m.cart_order_selected()}
      </Link>
    ) : (
      <button
        type="button"
        disabled
        className={buttonClass({ variant: "primary", size: "lg", block: true, className })}
      >
        {m.cart_order()}
      </button>
    );

  return (
    <>
      {/* 바탕은 옅은 회색 면이고 목록·요약은 흰 카드다. 바탕은 본문 폭을 넘어 화면 끝까지 칠한다(가로 스크롤 없이) */}
      <div className="-mx-4 -mt-8 -mb-16 bg-chip md:-mb-24 pb-36 shadow-[0_0_0_100vmax_var(--color-chip)] [clip-path:inset(0_-100vmax)] md:mx-0 md:pb-20">
        <div className="flex flex-col gap-2 px-4 pt-5 pb-4 md:flex-row md:items-end md:justify-between md:px-0 md:pt-10 md:pb-6">
          <PageTitle>{m.cart_title()}</PageTitle>
          <CheckoutSteps current="cart" />
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_380px] md:items-start md:gap-6">
          <SectionCard className="gap-0! md:py-6!">
            <div className="flex min-w-0 items-center justify-between gap-3 border-ink border-b pb-3.5">
              <label className="flex cursor-pointer items-center gap-2.5 font-bold text-body">
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={!purchasable.length}
                  onChange={(event) =>
                    setUnchecked(
                      event.target.checked
                        ? new Set()
                        : new Set(cart.items.map((item) => item.cartItemId)),
                    )
                  }
                  className={choiceClass}
                />
                {m.cart_select_all()}
                <span className="font-normal text-muted">
                  {m.cart_select_count({ selected: selected.length, total: purchasable.length })}
                </span>
              </label>
              <button
                type="button"
                disabled={!hydrated || pending || !selectedIds.length}
                onClick={() => removeSelected(selectedIds)}
                className={buttonClass({ variant: "subtle", size: "xs" })}
              >
                {m.cart_remove_selected()}
              </button>
            </div>
            <ul className="flex flex-col">
              {cart.items.map((item) => {
                const optionsId = `cart-line-options-${item.cartItemId}`;
                const name = item.productName;
                return (
                  <li
                    key={item.cartItemId}
                    className="flex min-w-0 gap-3 border-line border-b py-4 last:border-b-0 md:gap-4 md:py-5"
                  >
                    <input
                      type="checkbox"
                      checked={item.purchasable && !unchecked.has(item.cartItemId)}
                      disabled={!item.purchasable}
                      onChange={(event) => toggle(item.cartItemId, event.target.checked)}
                      aria-label={m.cart_select_item({ name })}
                      aria-describedby={optionsId}
                      className={`${choiceClass} mt-0.5`}
                    />
                    <Link
                      to="/products/$productId"
                      params={{ productId: productPathParam(item) }}
                      tabIndex={-1}
                      aria-hidden="true"
                      className="shrink-0"
                    >
                      <ProductThumb
                        src={item.thumbnailUrl}
                        alt=""
                        className={`h-[100px] w-20 bg-chip object-cover ${item.purchasable ? "" : "opacity-50"}`}
                      />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <Link
                          to="/products/$productId"
                          params={{ productId: productPathParam(item) }}
                          className="min-w-0 break-words text-body hover:underline"
                        >
                          {name}
                        </Link>
                        <button
                          type="button"
                          disabled={!hydrated || pending}
                          onClick={() => change({ intent: "remove", cartItemId: item.cartItemId })}
                          aria-label={m.cart_item_remove_label({ name })}
                          aria-describedby={optionsId}
                          className="-mt-1.5 -mr-1.5 flex size-8 shrink-0 items-center justify-center text-muted hover:text-ink disabled:opacity-50"
                        >
                          <X aria-hidden="true" className="size-4" strokeWidth={1.8} />
                        </button>
                      </div>
                      <LineOptions item={item} id={optionsId} />
                      {!item.purchasable ? (
                        <span className="text-caption text-point">
                          {item.unpurchasableReason === "SOLD_OUT"
                            ? m.cart_item_sold_out()
                            : m.cart_item_unavailable()}
                        </span>
                      ) : null}
                      <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2">
                        <QuantityStepper
                          name={name}
                          describedBy={optionsId}
                          quantity={item.quantity}
                          disabled={!hydrated || pending}
                          onChange={(quantity) =>
                            change({ intent: "update", cartItemId: item.cartItemId, quantity })
                          }
                        />
                        <b className="tabular text-body-lg">{formatPrice(item.totalPrice)}</b>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </SectionCard>

          <aside
            aria-labelledby="cart-summary"
            className="flex min-w-0 flex-col gap-2 md:sticky md:top-[9.5rem] md:gap-3"
          >
            <SectionCard
              title={m.cart_summary()}
              titleId="cart-summary"
              className="md:px-7 md:py-7"
            >
              {allSelected ? (
                <dl className="flex flex-col gap-3 text-body">
                  <div className="flex justify-between gap-3">
                    <dt className="text-sub">{m.cart_product_amount()}</dt>
                    <dd className="tabular">{formatPrice(cart.summary.productAmount)}</dd>
                  </div>
                  {/* 배송이 필요 없는 상품만 담았으면 배송비가 없다 */}
                  {cart.summary.requiresShipping ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-sub">{m.cart_delivery_fee()}</dt>
                      <dd className="tabular">{formatPrice(cart.summary.deliveryFee)}</dd>
                    </div>
                  ) : null}
                  <div className="mt-1 flex items-baseline justify-between gap-3 border-ink border-t pt-4">
                    <dt className="font-bold text-body-lg md:text-base">{m.cart_total_amount()}</dt>
                    <dd className="tabular font-bold text-[1.375rem] tracking-tight md:text-2xl">
                      {formatPrice(cart.summary.totalAmount)}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-body text-sub">{m.cart_selected_note()}</p>
              )}
              <p className="bg-chip px-3 py-2.5 text-caption text-sub">
                {m.cart_coupon_note()}
                {myCouponCount ? ` · ${m.cart_coupon_mine({ count: myCouponCount })}` : ""}{" "}
                <Link to="/coupons" className="text-ink underline underline-offset-2">
                  {m.cart_coupon_link()}
                </Link>
              </p>
              <div className="hidden md:block">{orderAction("")}</div>
            </SectionCard>
          </aside>
        </div>
      </div>

      {/* 모바일 주문 버튼은 화면 아래에 고정한다 — 바탕 칠(clip-path) 밖에 둔다 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-line border-t bg-page px-4 pt-2.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] md:hidden">
        {orderAction("")}
      </div>
    </>
  );
}

/** 수량 스테퍼 — 누를 때마다 서버에 바로 반영한다(1~999) */
function QuantityStepper({
  name,
  describedBy,
  quantity,
  disabled,
  onChange,
}: {
  name: string;
  describedBy: string;
  quantity: number;
  disabled: boolean;
  onChange: (quantity: number) => void;
}) {
  const step = "flex size-8 items-center justify-center disabled:text-line-strong";
  return (
    <div className="flex h-8 items-center border border-line-strong">
      <button
        type="button"
        disabled={disabled || quantity <= 1}
        onClick={() => onChange(quantity - 1)}
        aria-label={m.cart_quantity_decrease({ name })}
        aria-describedby={describedBy}
        className={step}
      >
        <Minus aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
      </button>
      <output
        aria-label={m.cart_item_quantity_label({ name })}
        className="tabular flex h-full w-10 items-center justify-center border-line-strong border-x text-meta"
      >
        {quantity}
      </output>
      <button
        type="button"
        disabled={disabled || quantity >= 999}
        onClick={() => onChange(quantity + 1)}
        aria-label={m.cart_quantity_increase({ name })}
        aria-describedby={describedBy}
        className={step}
      >
        <Plus aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
      </button>
    </div>
  );
}
