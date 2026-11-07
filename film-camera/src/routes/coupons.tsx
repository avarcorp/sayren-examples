import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AccountLayout } from "../components/account/account-layout";
import { DateText, EmptyState } from "../components/ui";
import { m } from "../i18n";
import { couponsQuery } from "../lib/account-queries";
import { formatMoney } from "../lib/format";
import { requireMember } from "../lib/guards";

export const Route = createFileRoute("/coupons")({
  beforeLoad: requireMember,
  loader: ({ context }) => context.queryClient.ensureQueryData(couponsQuery()),
  component: Coupons,
});

function Coupons() {
  const coupons = useSuspenseQuery(couponsQuery()).data;
  return (
    <AccountLayout title={m.coupons_title()}>
      {coupons.length === 0 ? (
        <EmptyState message={m.coupons_empty()} />
      ) : (
        <ul className="divide-y divide-line border-line border-y">
          {coupons.map((coupon) => (
            <li key={coupon.issueId} className="flex flex-col gap-1 py-4 text-body">
              <p className="font-semibold">{coupon.name}</p>
              {coupon.description ? <p className="text-sub">{coupon.description}</p> : null}
              <p className="text-meta text-sub">
                {coupon.minOrderAmount > 0
                  ? `${m.coupons_min({ amount: formatMoney(coupon.minOrderAmount) })} · `
                  : null}
                {coupon.validUntil ? (
                  <>
                    <DateText iso={coupon.validUntil} />
                    {m.coupons_until({ date: "" })}
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AccountLayout>
  );
}
