import { createFileRoute } from "@tanstack/react-router";
import { AccountLayout } from "../components/account/account-layout";
import { EmptyState } from "../components/ui";
import { usePointHistory, usePoints } from "../hooks/use-account";
import { m } from "../i18n";

/** 적립금 내역 유형 — 모르는 유형은 「기타」 */
function pointTypeLabel(type: string): string {
  switch (type) {
    case "EARN_REVIEW":
      return m.points_type_review();
    case "REVOKE_REVIEW":
      return m.points_type_revoke();
    case "EARN_PURCHASE":
      return m.points_type_purchase();
    case "EXPIRE":
      return m.points_type_expire();
    case "ADJUST":
      return m.points_type_adjust();
    case "USE_RESERVE":
      return m.points_type_use();
    case "USE_RELEASE":
      return m.points_type_release();
    case "REFUND_RESTORE":
      return m.points_type_refund();
    default:
      return m.points_type_other();
  }
}

import { pointHistoryQuery, pointsQuery } from "../lib/account-queries";
import { formatDate, formatMoney } from "../lib/format";
import { requireMember } from "../lib/guards";

/** 적립금 — 잔액·곧 소멸할 금액(서버 값)과 내역 */
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
  const points = usePoints();
  const history = usePointHistory();
  return (
    <AccountLayout title={m.account_menu_points()}>
      <dl className="flex flex-col gap-1 rounded-card border border-line p-4">
        <dt className="text-meta text-muted">{m.points_balance()}</dt>
        <dd className="font-bold text-2xl tabular">{formatMoney(points.balance)}</dd>
        {points.expiringSoon > 0 ? (
          <dd className="text-caption text-sale">
            {m.points_expiring({ amount: formatMoney(points.expiringSoon) })}
          </dd>
        ) : null}
      </dl>
      {history.contents.length === 0 ? (
        <EmptyState message={m.points_empty()} />
      ) : (
        <ul className="flex flex-col">
          {history.contents.map((entry) => (
            <li
              key={entry.entryId}
              className="flex items-center justify-between gap-3 border-line border-b py-3 text-meta"
            >
              <div className="flex min-w-0 flex-col">
                <span className="break-words">{pointTypeLabel(entry.type)}</span>
                <span className="text-caption text-muted">{formatDate(entry.createdAt)}</span>
              </div>
              <span
                className={`shrink-0 font-semibold tabular ${entry.amount < 0 ? "text-sub" : "text-point"}`}
              >
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
