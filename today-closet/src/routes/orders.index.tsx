import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Package } from "lucide-react";
import { z } from "zod";
import { MyPageShell } from "../components/mypage/my-page-shell";
import { OrderCard } from "../components/mypage/order-card";
import { Pagination } from "../components/mypage/pagination";
import { buttonClass } from "../components/ui/button";
import { EmptyState } from "../components/ui/section";
import { m } from "../i18n";
import { apiFor } from "../lib/api.server";
import { pageTitle } from "../lib/page-title";
import { readToken } from "../lib/session.server";

/** 조회 기간 — 서버 기본값(`from` 생략)이 최근 6개월이라 6개월이 기본이다 */
const PERIODS = ["3m", "6m", "1y"] as const;
type Period = (typeof PERIODS)[number];
const PERIOD_DAYS: Record<Period, number> = { "3m": 92, "6m": 183, "1y": 366 };

const ordersSearch = z.object({
  period: z.enum(["3m", "1y"]).optional().catch(undefined),
  page: z.coerce.number().int().min(2).optional().catch(undefined),
});

const getOrders = createServerFn({ method: "GET" })
  .validator(z.object({ period: z.enum(PERIODS), page: z.number().int().min(1) }))
  .handler(async ({ data }) => {
    const accessToken = readToken();
    if (!accessToken) throw redirect({ to: "/login", search: { redirectTo: "/orders" } });
    const from = new Date(Date.now() - PERIOD_DAYS[data.period] * 86_400_000).toISOString();
    return apiFor({ accessToken }).myOrders.list({ from, page: data.page, size: 20 });
  });

export const Route = createFileRoute("/orders/")({
  validateSearch: ordersSearch,
  loaderDeps: ({ search }) => ({
    period: search.period ?? ("6m" as const),
    page: search.page ?? 1,
  }),
  loader: ({ deps }) => getOrders({ data: deps }),
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, m.orders_title()) }] }),
  component: Orders,
});

const PERIOD_LABEL: Record<Period, () => string> = {
  "3m": () => m.mypage_period_3m(),
  "6m": () => m.mypage_period_6m(),
  "1y": () => m.mypage_period_1y(),
};

function Orders() {
  const orders = Route.useLoaderData();
  const { period = "6m" } = Route.useSearch();

  return (
    <MyPageShell current="orders" title={m.orders_title()}>
      <nav aria-label={m.mypage_period()} className="flex gap-1.5">
        {PERIODS.map((value) => (
          <Link
            key={value}
            to="/orders"
            search={{ period: value === "6m" ? undefined : value }}
            aria-current={period === value ? "true" : undefined}
            className={buttonClass({
              variant: period === value ? "outline" : "subtle",
              size: "xs",
            })}
          >
            {PERIOD_LABEL[value]()}
          </Link>
        ))}
      </nav>
      {orders.contents.length ? (
        <div className="flex flex-col gap-3">
          {orders.contents.map((order) => (
            <OrderCard key={order.orderId} order={order} />
          ))}
          <Pagination page={orders.page} totalPages={orders.totalPages} to="/orders" />
        </div>
      ) : (
        <EmptyState
          icon={<Package aria-hidden="true" className="size-10" strokeWidth={1.4} />}
          title={m.orders_empty()}
          description={m.mypage_orders_empty_period()}
          action={
            <Link to="/products" className={buttonClass({ variant: "outline", size: "sm" })}>
              {m.mypage_wishlist_browse()}
            </Link>
          }
        />
      )}
    </MyPageShell>
  );
}
