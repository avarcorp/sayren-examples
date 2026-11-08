import { createFileRoute } from "@tanstack/react-router";
import { CircleCheck } from "lucide-react";
import { z } from "zod";
import { Container, LinkButton, PageTitle } from "../../components/ui";
import { useOrder, useSession } from "../../hooks/use-account";
import { m } from "../../i18n";
import { orderQuery, sessionQuery } from "../../lib/account-queries";
import { formatMoney, orderNumber } from "../../lib/format";

/** 주문 완료 — 회원은 주문 요약을, 비회원은 비회원 주문 조회 안내를 보인다 */
export const Route = createFileRoute("/checkout/complete")({
  validateSearch: z.object({ orderId: z.string().min(1) }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const member = await context.queryClient.ensureQueryData(sessionQuery());
    if (member) await context.queryClient.ensureQueryData(orderQuery(deps.orderId));
    await context.queryClient.invalidateQueries({ queryKey: ["cart"] });
  },
  preload: false,
  component: OrderComplete,
});

function OrderComplete() {
  const member = useSession();
  return (
    <Container className="flex flex-col items-center gap-4 pt-12 text-center">
      <CircleCheck className="size-12 text-point" />
      <PageTitle>{m.complete_title()}</PageTitle>
      <p className="text-body text-sub">{m.complete_message()}</p>
      {member ? <MemberOrder /> : <p className="text-meta text-muted">{m.complete_guest_hint()}</p>}
      <div className="flex w-full max-w-sm flex-col gap-2 pt-4">
        {member ? (
          <LinkButton to="/orders">{m.account_menu_orders()}</LinkButton>
        ) : (
          <LinkButton to="/guest-order">{m.nav_guest_order()}</LinkButton>
        )}
        <LinkButton to="/products" variant="secondary">
          {m.complete_continue()}
        </LinkButton>
      </div>
    </Container>
  );
}

function MemberOrder() {
  const { orderId } = Route.useSearch();
  const order = useOrder(orderId);
  if (!order) return null;
  const no = orderNumber(order.orderNo);
  return (
    <dl className="grid w-full max-w-sm grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-card border border-line p-4 text-left text-meta">
      {no ? (
        <>
          <dt className="text-muted">{m.order_number()}</dt>
          <dd className="tabular">{no}</dd>
        </>
      ) : null}
      <dt className="text-muted">{m.order_paid_amount()}</dt>
      <dd className="font-semibold tabular">
        {formatMoney(order.payment.totalAmount, order.currency)}
      </dd>
    </dl>
  );
}
