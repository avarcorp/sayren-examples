import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { buttonClass } from "../components/atoms/button";
import { Pagination } from "../components/molecules/pagination";
import { AccountTitle } from "../components/templates/account-template";
import { getMyClaimsFn, withdrawClaimFn } from "../lib/account";
import { formatDate } from "../lib/dates";
import { formatMoney } from "../lib/format";
import { CLAIM_REASONS, CLAIM_STATUS, CLAIM_TYPE } from "../lib/order-status";

export const Route = createFileRoute("/account/claims")({
  validateSearch: z.object({ page: z.number().int().min(1).optional().catch(undefined) }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getMyClaimsFn({ data: deps }),
  head: () => ({ meta: [{ title: "취소·반품·교환 | 설기로운" }] }),
  component: Claims,
});

/** 취소·반품·교환 내역 — 종류·상태·사유·환불 예정 금액, 반품지, 접수 상태면 철회 */
function Claims() {
  const page = Route.useLoaderData();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <AccountTitle title="취소·반품·교환" aside={`${page.totalElements}건`} />
      {error ? (
        <p role="alert" className="text-primary text-small">
          {error}
        </p>
      ) : null}
      {page.contents.length === 0 ? (
        <p className="border-ink border-t py-24 text-center text-muted">신청한 내역이 없습니다.</p>
      ) : (
        <ul className="flex flex-col border-ink border-t">
          {page.contents.map((c) => (
            <li
              key={c.claimId}
              className="flex flex-wrap items-start justify-between gap-4 border-line border-b py-6 text-body"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-bold text-caption">
                  {CLAIM_TYPE[c.type]} {CLAIM_STATUS[c.status] ?? c.status}
                  <span className="ml-2 font-normal text-muted">{c.claimNo ?? ""}</span>
                </span>
                <span>{c.productName}</span>
                <span className="text-caption text-muted">
                  {CLAIM_REASONS.find((r) => r.value === c.reason)?.label ?? c.reason} · 수량{" "}
                  {c.quantity} · {formatDate(c.requestedAt)}
                </span>
                {c.expectedRefundAmount != null && c.type !== "EXCHANGE" ? (
                  <span className="text-small">
                    환불 예정 {formatMoney(c.expectedRefundAmount)}
                  </span>
                ) : null}
                {c.rejectReason ? (
                  <span className="text-primary text-small">거절 사유 · {c.rejectReason}</span>
                ) : null}
                {c.returnAddress && c.status === "REQUESTED" ? (
                  <span className="text-caption text-muted">
                    보낼 곳 · ({c.returnAddress.zipCode}) {c.returnAddress.address1}{" "}
                    {c.returnAddress.address2 ?? ""}
                  </span>
                ) : null}
              </div>
              {c.status === "REQUESTED" ? (
                <button
                  type="button"
                  className={buttonClass({ variant: "subtle", size: "sm" })}
                  onClick={async () => {
                    const r = await withdrawClaimFn({ data: { claimId: c.claimId } });
                    setError(r.error);
                    await router.invalidate();
                  }}
                >
                  신청 철회
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page.page} totalPages={page.totalPages} />
    </>
  );
}
