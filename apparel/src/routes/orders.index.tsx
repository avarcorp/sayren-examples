import { formatOrderNo } from "@sayren/storefront-sdk";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { AccountLayout } from "../components/account/account-layout";
import { OrderItemRow } from "../components/account/order-item-row";
import { Pagination } from "../components/product/list-controls";
import { ButtonLink } from "../components/ui/button";
import { EmptyState } from "../components/ui/empty-state";
import { m } from "../i18n";
import { ordersQuery } from "../lib/account-queries";
import { requireMember } from "../lib/require-member";

const dateOf = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(iso));

export const Route = createFileRoute("/orders/")({
  validateSearch: z.object({ page: z.number().int().min(1).optional() }),
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: async ({ context, deps }) => {
    await requireMember(context.queryClient, "/orders");
    return context.queryClient.ensureQueryData(ordersQuery(deps.page));
  },
  head: () => ({ meta: [{ title: m.account_orders() }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { page = 1 } = Route.useSearch();
  const orders = useSuspenseQuery(ordersQuery(page)).data;
  return (
    <AccountLayout title={m.account_orders()}>
      {orders.contents.length === 0 ? (
        <EmptyState
          message={m.orders_empty()}
          action={<ButtonLink to="/products">{m.cart_go_shopping()}</ButtonLink>}
        />
      ) : (
        <ul className="flex flex-col gap-6">
          {orders.contents.map((order) => (
            <li key={order.orderId} className="border-line border-t">
              <div className="flex items-center justify-between gap-3 py-3">
                <p className="text-meta">
                  <span className="font-semibold">{dateOf(order.orderedAt)}</span>
                  <span className="tabular ml-2 text-sub">{formatOrderNo(order.orderNo)}</span>
                </p>
                <Link
                  to="/orders/$orderId"
                  params={{ orderId: order.orderId }}
                  className="flex min-h-11 items-center text-meta text-point underline underline-offset-4"
                >
                  {m.orders_detail()}
                </Link>
              </div>
              <ul className="border-line border-t">
                {order.items.map((item) => (
                  <OrderItemRow key={item.orderItemId} item={item} currency={order.currency} />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
      <Pagination
        page={page}
        totalPages={orders.totalPages}
        hrefFor={(p) => ({ search: { page: p } })}
      />
    </AccountLayout>
  );
}
