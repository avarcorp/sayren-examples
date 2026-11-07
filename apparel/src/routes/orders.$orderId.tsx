import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { AccountLayout } from "../components/account/account-layout";
import { OrderDetail } from "../components/account/order-detail";
import { m } from "../i18n";
import { orderQuery } from "../lib/account-queries";
import { requireMember } from "../lib/require-member";

export const Route = createFileRoute("/orders/$orderId")({
  loader: async ({ context, params }) => {
    await requireMember(context.queryClient, `/orders/${params.orderId}`);
    const order = await context.queryClient.ensureQueryData(orderQuery(params.orderId));
    if (!order) throw notFound();
  },
  head: () => ({ meta: [{ title: m.order_detail_title() }] }),
  component: OrderPage,
});

function OrderPage() {
  const { orderId } = Route.useParams();
  const order = useSuspenseQuery(orderQuery(orderId)).data;
  const queryClient = useQueryClient();
  if (!order) return null;
  return (
    <AccountLayout title={m.order_detail_title()}>
      <OrderDetail
        order={order}
        onChanged={() => queryClient.invalidateQueries({ queryKey: orderQuery(orderId).queryKey })}
      />
    </AccountLayout>
  );
}
