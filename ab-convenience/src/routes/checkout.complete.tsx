import { formatOrderNo } from "@sayren/storefront-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { CircleCheck } from "lucide-react";
import { useEffect } from "react";
import { z } from "zod";
import { CART_COUNT_KEY } from "../components/browse/cart-count";
import { CheckoutSteps } from "../components/checkout/checkout-steps";
import { LineOptions } from "../components/line-options";
import { buttonClass } from "../components/ui/button";
import { InfoList } from "../components/ui/section";
import { m } from "../i18n";
import { apiFor } from "../lib/api.server";
import { clearDirectLine } from "../lib/direct-checkout.server";
import { formatPrice } from "../lib/format";
import { pageTitle } from "../lib/page-title";
import { readToken } from "../lib/session.server";

const completeSearch = z.object({ orderId: z.string().optional().catch(undefined) });

const getCompletedOrder = createServerFn({ method: "GET" })
  .validator(completeSearch)
  .handler(async ({ data }) => {
    // 주문이 끝났다 — 바로구매에 적어 둔 입력값(HttpOnly 쿠키)을 지운다
    clearDirectLine();
    // 비회원은 주문 조회에 비밀번호가 필요하다 — 완료 화면에서는 주문번호만 보여 주고 비회원 주문 조회로 보낸다
    const accessToken = readToken();
    if (!data.orderId || !accessToken) return { order: null, member: Boolean(accessToken) };
    const order = await apiFor({ accessToken })
      .myOrders.get(data.orderId)
      .catch(() => null);
    return { order, member: true };
  });

export const Route = createFileRoute("/checkout/complete")({
  validateSearch: completeSearch,
  loaderDeps: ({ search }) => search,
  // loader가 바로구매 쿠키를 지운다 — 미리 불러오기로 지우지 않는다
  preload: false,
  loader: ({ deps }) => getCompletedOrder({ data: deps }),
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, m.checkout_complete_title()) }] }),
  component: CheckoutComplete,
});

function CheckoutComplete() {
  const { order, member } = Route.useLoaderData();
  const { orderId } = Route.useSearch();
  const queryClient = useQueryClient();
  // 주문한 장바구니 줄은 서버가 비운다 — 헤더 장바구니 배지를 다시 받는다
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: CART_COUNT_KEY });
  }, [queryClient]);
  // 화면에 보이는 번호는 숫자 주문번호다(번호 체계 이전 주문은 주문 id)
  const orderNumber = order?.orderNo ? formatOrderNo(order.orderNo) : orderId;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 py-6 md:py-10">
      <div className="flex justify-center">
        <CheckoutSteps current="complete" />
      </div>
      <div className="flex flex-col items-center gap-3 text-center">
        <CircleCheck aria-hidden="true" className="size-14 text-ink" strokeWidth={1.3} />
        <h1 className="font-bold text-xl md:text-2xl">{m.checkout_complete_heading()}</h1>
        <p className="text-body text-sub">
          {orderId ? m.checkout_complete_description() : m.checkout_complete_check_orders()}
        </p>
      </div>

      {orderNumber || order ? (
        <div className="flex flex-col gap-4 border-ink border-t pt-5">
          {orderNumber ? (
            <InfoList
              rows={[
                {
                  key: "orderNo",
                  label: m.checkout_complete_order_no(),
                  value: <b className="tabular">{orderNumber}</b>,
                },
                ...(order
                  ? [
                      {
                        key: "total",
                        label: m.checkout_complete_total_amount(),
                        value: <b className="tabular">{formatPrice(order.payment.totalAmount)}</b>,
                      },
                    ]
                  : []),
              ]}
            />
          ) : null}
          {order ? (
            <ul className="flex flex-col border-line border-t">
              {order.items.map((item) => (
                <li
                  key={item.orderItemId}
                  className="flex min-w-0 items-start justify-between gap-4 border-line border-b py-3.5"
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="break-words text-body">
                      {item.productName}
                      <span className="text-muted"> × {item.quantity}</span>
                    </span>
                    <LineOptions item={item} />
                  </span>
                  <span className="tabular shrink-0 text-body">{formatPrice(item.totalPrice)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        {/* 비회원 주문은 주문번호·연락처·주문 조회 비밀번호로 찾는다 */}
        {member || !orderId ? (
          <Link to="/orders" className={buttonClass({ variant: "outline", size: "md" })}>
            {m.checkout_complete_orders()}
          </Link>
        ) : (
          <Link
            to="/guest-order"
            search={{ orderId }}
            className={buttonClass({ variant: "outline", size: "md" })}
          >
            {m.checkout_complete_guest_order()}
          </Link>
        )}
        <Link to="/products" className={buttonClass({ variant: "primary", size: "md" })}>
          {m.checkout_complete_continue_shopping()}
        </Link>
      </div>
    </div>
  );
}
