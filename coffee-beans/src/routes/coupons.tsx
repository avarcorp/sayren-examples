import { createFileRoute } from "@tanstack/react-router";
import { AccountLayout } from "../components/account/account-layout";
import { EmptyState } from "../components/ui";
import { useCoupons } from "../hooks/use-account";
import { m } from "../i18n";
import { couponsQuery } from "../lib/account-queries";
import { formatDate } from "../lib/format";
import { requireMember } from "../lib/guards";

/** 사용할 수 있는 쿠폰 */
export const Route = createFileRoute("/coupons")({
  beforeLoad: requireMember,
  loader: ({ context }) => context.queryClient.ensureQueryData(couponsQuery()),
  component: Coupons,
});

function Coupons() {
  const coupons = useCoupons();
  return (
    <AccountLayout title={m.account_menu_coupons()}>
      {coupons.length === 0 ? (
        <EmptyState message={m.coupons_empty()} />
      ) : (
        <ul className="flex flex-col gap-2">
          {coupons.map((coupon) => (
            <li
              key={coupon.issueId}
              className="flex flex-col gap-1 rounded-card border border-line p-4"
            >
              <p className="break-words font-semibold text-body">{coupon.name}</p>
              {coupon.description ? (
                <p className="break-words text-meta text-sub">{coupon.description}</p>
              ) : null}
              <p className="text-caption text-muted">
                {coupon.validUntil
                  ? m.coupons_until({ date: formatDate(coupon.validUntil) })
                  : m.coupons_no_expiry()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AccountLayout>
  );
}
