import { formatOrderNo } from "@sayren/storefront-sdk";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { ButtonLink } from "../components/ui/button";
import { MoneyRow, SummaryBox } from "../components/ui/money";
import { Container, PageTitle } from "../components/ui/page-title";
import { m } from "../i18n";
import { cartQuery, orderQuery } from "../lib/account-queries";

/** 주문 완료 — 회원은 주문 요약, 비회원은 주문번호와 비회원 주문 조회 안내 */
export const Route = createFileRoute("/checkout/complete")({
  validateSearch: z.object({ orderId: z.string().optional(), orderNo: z.string().optional() }),
  loaderDeps: ({ search }) => ({ orderId: search.orderId }),
  loader: async ({ context, deps }) => {
    if (!deps.orderId) throw notFound();
    await context.queryClient.ensureQueryData(orderQuery(deps.orderId));
  },
  preload: false,
  head: () => ({ meta: [{ title: m.complete_title() }] }),
  component: OrderComplete,
});

function OrderComplete() {
  const { orderId = "", orderNo } = Route.useSearch();
  const order = useSuspenseQuery(orderQuery(orderId)).data;
  const queryClient = useQueryClient();
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: cartQuery().queryKey });
  }, [queryClient]);
  const number = order?.orderNo ?? orderNo;

  return (
    <Container className="max-w-xl">
      <PageTitle>{m.complete_title()}</PageTitle>
      <div className="flex flex-col gap-6">
        <p className="text-body text-sub">{m.complete_message()}</p>
        <SummaryBox>
          {number ? (
            <div className="flex justify-between gap-4 text-body text-sub">
              <dt>{m.order_no()}</dt>
              <dd className="tabular text-ink">{formatOrderNo(number)}</dd>
            </div>
          ) : null}
          {order ? (
            <MoneyRow
              label={m.amount_pay()}
              amount={order.payment.totalAmount}
              currency={order.currency}
              strong
            />
          ) : null}
        </SummaryBox>
        {order?.testPayment ? <p className="text-caption text-muted">{m.order_test()}</p> : null}
        <div className="grid grid-cols-2 gap-2">
          {order ? (
            <ButtonLink
              to="/orders/$orderId"
              params={{ orderId: order.orderId }}
              variant="secondary"
            >
              {m.complete_view_order()}
            </ButtonLink>
          ) : (
            <ButtonLink to="/guest-order" variant="secondary">
              {m.nav_guest_order()}
            </ButtonLink>
          )}
          <ButtonLink to="/products">{m.complete_continue()}</ButtonLink>
        </div>
      </div>
    </Container>
  );
}
