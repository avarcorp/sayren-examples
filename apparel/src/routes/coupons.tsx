import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AccountLayout } from "../components/account/account-layout";
import { EmptyState } from "../components/ui/empty-state";
import { m } from "../i18n";
import { couponsQuery } from "../lib/account-queries";
import { formatMoney } from "../lib/format";
import { requireMember } from "../lib/require-member";

const dateOf = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(iso));

export const Route = createFileRoute("/coupons")({
  loader: async ({ context }) => {
    await requireMember(context.queryClient, "/coupons");
    return context.queryClient.ensureQueryData(couponsQuery());
  },
  head: () => ({ meta: [{ title: m.account_coupons() }] }),
  component: CouponsPage,
});

function CouponsPage() {
  const coupons = useSuspenseQuery(couponsQuery()).data;
  return (
    <AccountLayout title={m.account_coupons()}>
      {coupons.length === 0 ? (
        <EmptyState message={m.coupons_empty()} />
      ) : (
        <ul className="flex flex-col gap-3">
          {coupons.map((coupon) => (
            <li
              key={coupon.issueId}
              className="flex flex-col gap-1 border border-line p-4 text-meta"
            >
              <p className="font-semibold text-body">{coupon.name}</p>
              {coupon.minOrderAmount > 0 ? (
                <p className="text-sub">
                  {m.coupon_min_order({ amount: formatMoney(coupon.minOrderAmount) })}
                </p>
              ) : null}
              <p className="text-muted">
                {coupon.validUntil
                  ? m.coupon_until({ date: dateOf(coupon.validUntil) })
                  : m.coupon_no_expiry()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AccountLayout>
  );
}
