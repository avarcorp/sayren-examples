import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AccountLayout } from "../../components/account/account-layout";
import { OrderCard } from "../../components/account/order-card";
import { Pagination } from "../../components/pagination";
import { ButtonLink, EmptyState } from "../../components/ui";
import { m } from "../../i18n";
import { ordersQuery } from "../../lib/account-queries";
import { requireMember } from "../../lib/guards";

export const Route = createFileRoute("/orders/")({
  beforeLoad: requireMember,
  validateSearch: z.object({ page: z.number().int().min(1).optional().catch(undefined) }),
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(ordersQuery(deps.page)),
  component: Orders,
});

function Orders() {
  const { page = 1 } = Route.useSearch();
  const orders = useSuspenseQuery(ordersQuery(page)).data;
  return (
    <AccountLayout title={m.orders_title()}>
      {orders.contents.length === 0 ? (
        <EmptyState
          message={m.orders_empty()}
          action={
            <ButtonLink to="/products" variant="secondary">
              {m.cart_go_shopping()}
            </ButtonLink>
          }
        />
      ) : (
        <ul className="flex flex-col gap-10">
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
        linkFor={(p) => ({ to: "/orders", search: { page: p } })}
      />
    </AccountLayout>
  );
}
