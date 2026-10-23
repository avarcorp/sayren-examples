import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { OrderCompleteTemplate } from "../components/templates/order-complete-template";
import { getCompletedOrderFn } from "../lib/orders";

const completeSearch = z.object({ orderId: z.string().optional().catch(undefined) });

export const Route = createFileRoute("/checkout/complete")({
  validateSearch: completeSearch,
  loaderDeps: ({ search }) => search,
  // loader가 바로구매 쿠키를 지운다 — 미리 불러오기로 지우지 않는다
  preload: false,
  loader: ({ deps }) => getCompletedOrderFn({ data: deps }),
  head: () => ({ meta: [{ title: "주문 완료 | 설기로운" }] }),
  staticData: { checkoutStep: 3 },
  component: CompletePage,
});

function CompletePage() {
  const { order, member } = Route.useLoaderData();
  const { orderId } = Route.useSearch();
  const queryClient = useQueryClient();
  // 주문한 장바구니 줄은 서버가 비운다 — 헤더 장바구니 수를 다시 받는다
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: ["cart"] });
  }, [queryClient]);
  return <OrderCompleteTemplate order={order} orderId={orderId} member={member} />;
}
