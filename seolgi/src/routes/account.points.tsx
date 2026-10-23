import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Pagination } from "../components/molecules/pagination";
import { AccountTitle } from "../components/templates/account-template";
import { getPointsFn } from "../lib/account";
import { formatDate } from "../lib/dates";
import { formatMoney } from "../lib/format";

export const Route = createFileRoute("/account/points")({
  validateSearch: z.object({ page: z.number().int().min(1).optional().catch(undefined) }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getPointsFn({ data: deps }),
  head: () => ({ meta: [{ title: "적립금 | 설기로운" }] }),
  component: Points,
});

const TYPE: Record<string, string> = {
  PURCHASE_EARN: "구매 적립",
  REVIEW_REWARD: "리뷰 적립",
  SIGNUP: "가입 축하",
  USE: "주문에 사용",
  USE_CANCEL: "사용 취소",
  EXPIRE: "기간 만료",
  ADJUST: "조정",
  REVOKE: "적립 회수",
};

/** 적립금 — 잔액·30일 안 소멸 예정, 내역(적립은 +, 사용은 −) */
function Points() {
  const { points, history } = Route.useLoaderData();
  return (
    <>
      <AccountTitle title="적립금" />
      <div className="flex flex-wrap items-end gap-x-10 gap-y-2 border-ink border-t pt-6">
        <p className="flex flex-col gap-1">
          <span className="text-muted text-small">보유 적립금</span>
          <span className="font-bold text-figure leading-none">
            {formatMoney(points?.balance ?? 0)}
          </span>
        </p>
        {points?.expiringSoon ? (
          <p className="text-muted text-small">
            30일 안 소멸 예정 {formatMoney(points.expiringSoon)}
          </p>
        ) : null}
      </div>
      <ul className="flex flex-col border-ink border-t">
        {history.contents.length === 0 ? (
          <li className="py-16 text-center text-muted">적립·사용 내역이 없습니다.</li>
        ) : (
          history.contents.map((e) => (
            <li
              key={e.entryId}
              className="flex items-center justify-between gap-4 border-line border-b py-4 text-body"
            >
              <span className="flex flex-col gap-0.5">
                <span>{TYPE[e.type] ?? e.type}</span>
                <span className="text-caption text-muted">{formatDate(e.createdAt)}</span>
              </span>
              <span className="flex flex-col items-end gap-0.5">
                <span className={`font-medium ${e.amount > 0 ? "text-primary" : ""}`}>
                  {e.amount > 0 ? "+" : "−"}
                  {formatMoney(Math.abs(e.amount))}
                </span>
                <span className="text-caption text-muted">잔액 {formatMoney(e.balanceAfter)}</span>
              </span>
            </li>
          ))
        )}
      </ul>
      <Pagination page={history.page} totalPages={history.totalPages} />
    </>
  );
}
