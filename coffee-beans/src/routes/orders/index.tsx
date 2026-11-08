import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { AccountLayout } from "../../components/account/account-layout";
import { OrderCard } from "../../components/account/order-card";
import { Pagination } from "../../components/pagination";
import { EmptyState, LinkButton } from "../../components/ui";
import { useOrders } from "../../hooks/use-account";
import { m } from "../../i18n";
import { ordersQuery } from "../../lib/account-queries";
import { requireMember } from "../../lib/guards";

/** 주문 내역 — 회원 전용 */
export const Route = createFileRoute("/orders/")({
  validateSearch: z.object({ page: z.number().int().min(1).optional() }),
  beforeLoad: requireMember,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(ordersQuery(deps.page ?? 1)),
  component: OrderList,
});

function OrderList() {
  const { page = 1 } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const orders = useOrders(page);
  return (
    <AccountLayout title={m.account_menu_orders()}>
      {orders.contents.length === 0 ? (
        <EmptyState
          message={m.orders_empty()}
          action={
            <LinkButton to="/products" variant="secondary">
              {m.cart_browse()}
            </LinkButton>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.contents.map((order) => (
            <li key={order.orderId}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
      <Pagination
        page={page}
        totalPages={orders.totalPages}
        onChange={(next) => navigate({ search: { page: next } })}
      />
    </AccountLayout>
  );
}
