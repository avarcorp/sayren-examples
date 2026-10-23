import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Pagination } from "../components/molecules/pagination";
import { OrderList } from "../components/organisms/order-list";
import { AccountTitle } from "../components/templates/account-template";
import { getMyOrdersFn } from "../lib/account";

export const Route = createFileRoute("/account/")({
  validateSearch: z.object({ page: z.number().int().min(1).optional().catch(undefined) }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getMyOrdersFn({ data: deps }),
  head: () => ({ meta: [{ title: "주문 내역 | 설기로운" }] }),
  component: Orders,
});

function Orders() {
  const page = Route.useLoaderData();
  return (
    <>
      <AccountTitle title="주문 내역" aside={`${page.totalElements}건`} />
      <OrderList orders={page.contents} />
      <Pagination page={page.page} totalPages={page.totalPages} />
    </>
  );
}
