import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AccountLayout } from "../components/account/account-layout";
import { EmptyState } from "../components/ui/empty-state";
import { MoneyRow, SummaryBox } from "../components/ui/money";
import { m } from "../i18n";
import { pointsQuery } from "../lib/account-queries";
import { formatMoney } from "../lib/format";
import { requireMember } from "../lib/require-member";

const dateOf = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(iso));

export const Route = createFileRoute("/points")({
  loader: async ({ context }) => {
    await requireMember(context.queryClient, "/points");
    return context.queryClient.ensureQueryData(pointsQuery());
  },
  head: () => ({ meta: [{ title: m.account_points() }] }),
  component: PointsPage,
});

function PointsPage() {
  const { points, history } = useSuspenseQuery(pointsQuery()).data;
  return (
    <AccountLayout title={m.account_points()}>
      <SummaryBox>
        <MoneyRow label={m.points_balance()} amount={points.balance} strong />
        {points.expiringSoon > 0 ? (
          <MoneyRow label={m.points_expiring()} amount={points.expiringSoon} />
        ) : null}
      </SummaryBox>
      <h2 className="pt-8 pb-3 font-semibold text-body-lg">{m.points_history()}</h2>
      {history.length === 0 ? (
        <EmptyState message={m.points_empty()} />
      ) : (
        <ul className="border-line border-t">
          {history.map((entry) => (
            <li
              key={entry.entryId}
              className="flex items-center justify-between gap-3 border-line border-b py-3 text-meta"
            >
              <span className="text-sub">{dateOf(entry.createdAt)}</span>
              <span className={`tabular font-semibold ${entry.amount < 0 ? "text-sale" : ""}`}>
                {entry.amount > 0 ? "+" : ""}
                {formatMoney(entry.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AccountLayout>
  );
}
