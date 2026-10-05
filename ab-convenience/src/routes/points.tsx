import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MyPageShell } from "../components/mypage/my-page-shell";
import { Pagination } from "../components/mypage/pagination";
import { EmptyState, SectionHeader } from "../components/ui/section";
import { lazyMessages, m } from "../i18n";
import { apiFor } from "../lib/api.server";
import { formatDateTime, formatPrice } from "../lib/format";
import { pageTitle } from "../lib/page-title";
import { readToken } from "../lib/session.server";

const HISTORY_SIZE = 20;

/** 내 적립금 — 잔액·30일 안 소멸 예정액(서버가 센 값)과 내역 한 페이지 */
const getPoints = createServerFn({ method: "GET" })
  .validator(z.object({ page: z.number().int().min(1) }))
  .handler(async ({ data }) => {
    const accessToken = readToken();
    if (!accessToken) throw redirect({ to: "/login", search: { redirectTo: "/points" } });
    const api = apiFor({ accessToken });
    const [summary, history] = await Promise.all([
      api.member.getPoints(),
      api.member.listPointHistory({ page: data.page, size: HISTORY_SIZE }),
    ]);
    return { summary, history };
  });

const pointsSearch = z.object({
  page: z.coerce.number().int().min(2).optional().catch(undefined),
});

export const Route = createFileRoute("/points")({
  validateSearch: pointsSearch,
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ deps }) => getPoints({ data: { page: deps.page } }),
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, m.points_title()) }] }),
  component: Points,
});

/** 내역 유형 → 이름. 서버가 유형을 더할 수 있어 모르는 값은 「기타」다 */
const ENTRY_LABEL: Readonly<Record<string, string>> = lazyMessages({
  EARN_REVIEW: () => m.points_entry_earn_review(),
  REVOKE_REVIEW: () => m.points_entry_revoke_review(),
  EARN_PURCHASE: () => m.points_entry_earn_purchase(),
  EXPIRE: () => m.points_entry_expire(),
  ADJUST: () => m.points_entry_adjust(),
  OPENING: () => m.points_entry_opening(),
  USE_RESERVE: () => m.points_entry_use(),
  USE_RELEASE: () => m.points_entry_use_release(),
  REFUND_RESTORE: () => m.points_entry_refund_restore(),
});

/** 변동액 — 적립은 +, 사용·회수·소멸은 −를 붙여 그대로 보인다 */
function signedPrice(amount: number): string {
  return amount > 0 ? `+${formatPrice(amount)}` : `−${formatPrice(-amount)}`;
}

/**
 * 내 적립금 — 잔액(큰 숫자)·소멸 예정·내역. 적립·사용·소멸 금액은 모두 서버가 정한 값이고 화면은 그대로 보인다.
 * 적립금 사용은 주문서에서 한다. 내역은 데스크톱 표, 모바일 카드다.
 */
function Points() {
  const { summary, history } = Route.useLoaderData();

  return (
    <MyPageShell current="points" title={m.points_title()}>
      <div className="flex min-w-0 flex-col gap-2">
        <dl className="grid min-w-0 border border-ink md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-1.5 bg-brand-strong px-5 py-6 text-white md:px-7">
            <dt className="text-meta text-line-strong">{m.points_balance()}</dt>
            <dd className="tabular break-all font-bold text-[1.75rem] tracking-tight md:text-[2rem]">
              {formatPrice(summary.balance)}
            </dd>
          </div>
          <div className="flex min-w-0 flex-col justify-center gap-1.5 px-5 py-5 md:px-7">
            <dt className="text-meta text-sub">{m.points_expiring_soon()}</dt>
            <dd
              className={`tabular break-all font-bold text-xl ${summary.expiringSoon > 0 ? "text-point" : ""}`}
            >
              {formatPrice(summary.expiringSoon)}
            </dd>
          </div>
        </dl>
        <p className="text-caption text-muted">{m.mypage_points_use_notice()}</p>
      </div>

      <section aria-labelledby="points-history" className="flex min-w-0 flex-col gap-4">
        <SectionHeader id="points-history" title={m.points_history()} rule />
        {history.contents.length === 0 ? (
          <EmptyState title={m.points_history_empty()} />
        ) : (
          <>
            {/* 데스크톱 — 표 */}
            <table className="hidden w-full table-fixed text-body md:table">
              <thead className="border-line border-b text-meta text-muted">
                <tr>
                  <th scope="col" className="w-44 py-3 text-left font-normal">
                    {m.mypage_points_date()}
                  </th>
                  <th scope="col" className="py-3 text-left font-normal">
                    {m.mypage_points_entry()}
                  </th>
                  <th scope="col" className="w-36 py-3 text-right font-normal">
                    {m.mypage_points_amount()}
                  </th>
                  <th scope="col" className="w-36 py-3 text-right font-normal">
                    {m.mypage_points_balance_after()}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {history.contents.map((entry) => (
                  <tr key={entry.entryId}>
                    <td className="tabular py-3.5 text-meta text-sub">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="break-words py-3.5">
                      {ENTRY_LABEL[entry.type] ?? m.points_entry_other()}
                    </td>
                    <td
                      className={`tabular py-3.5 text-right font-bold ${entry.amount > 0 ? "" : "text-muted"}`}
                    >
                      {signedPrice(entry.amount)}
                    </td>
                    <td className="tabular py-3.5 text-right text-sub">
                      {formatPrice(entry.balanceAfter)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* 모바일 — 카드 */}
            <ul className="flex flex-col divide-y divide-line md:hidden">
              {history.contents.map((entry) => (
                <li
                  key={entry.entryId}
                  className="flex min-w-0 items-center justify-between gap-3 py-3.5"
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="break-words text-body">
                      {ENTRY_LABEL[entry.type] ?? m.points_entry_other()}
                    </span>
                    <span className="tabular text-caption text-muted">
                      {formatDateTime(entry.createdAt)}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-0.5">
                    <span
                      className={`tabular font-bold text-body ${entry.amount > 0 ? "" : "text-muted"}`}
                    >
                      {signedPrice(entry.amount)}
                    </span>
                    <span className="tabular text-caption text-muted">
                      {m.points_balance_after({ amount: formatPrice(entry.balanceAfter) })}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
        <Pagination page={history.page} totalPages={history.totalPages} to="/points" />
      </section>
    </MyPageShell>
  );
}
