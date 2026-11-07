import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AccountLayout } from "../components/account/account-layout";
import { DateText, EmptyState, SectionTitle } from "../components/ui";
import { m } from "../i18n";
import { pointHistoryQuery, pointsQuery } from "../lib/account-queries";
import { formatMoney } from "../lib/format";
import { requireMember } from "../lib/guards";

export const Route = createFileRoute("/points")({
  beforeLoad: requireMember,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(pointsQuery()),
      context.queryClient.ensureQueryData(pointHistoryQuery()),
    ]),
  component: Points,
});

function Points() {
  const points = useSuspenseQuery(pointsQuery()).data;
  const history = useSuspenseQuery(pointHistoryQuery()).data;
  return (
    <AccountLayout title={m.points_title()}>
      <div className="flex flex-col gap-1 border-ink border-b pb-4">
        <p className="text-meta text-sub">{m.points_balance()}</p>
        <p className="tabular font-bold text-3xl">{formatMoney(points.balance)}</p>
        {points.expiringSoon > 0 ? (
          <p className="text-meta text-sub">
            {m.points_expiring({ amount: formatMoney(points.expiringSoon) })}
          </p>
        ) : null}
      </div>
      <section aria-labelledby="points-history" className="flex flex-col gap-2">
        <SectionTitle id="points-history">{m.points_history()}</SectionTitle>
        {history.contents.length === 0 ? (
          <EmptyState message={m.points_empty()} />
        ) : (
          <ul className="divide-y divide-line border-line border-y">
            {history.contents.map((entry) => (
              <li key={entry.entryId} className="tabular flex justify-between gap-4 py-3 text-body">
                <span className="text-sub">
                  <DateText iso={entry.createdAt} />
                </span>
                <span className="font-semibold">{formatMoney(entry.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AccountLayout>
  );
}
