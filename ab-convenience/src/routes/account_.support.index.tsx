import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { z } from "zod";
import { AnswerStatus } from "../components/mypage/my-inquiry-item";
import { MyPageShell } from "../components/mypage/my-page-shell";
import { Pagination } from "../components/mypage/pagination";
import { Badge } from "../components/ui/badge";
import { buttonClass } from "../components/ui/button";
import { EmptyState } from "../components/ui/section";
import { m } from "../i18n";
import { formatDateTime } from "../lib/format";
import { listMySupportInquiries } from "../lib/inquiries";
import { pageTitle } from "../lib/page-title";
import { SUPPORT_CATEGORY_LABELS } from "../lib/support-category";

const search = z.object({
  page: z.coerce.number().int().min(2).optional().catch(undefined),
});

/** 1:1 문의 목록 — 유형·제목·답변 상태·작성일. 누르면 상세(답변)로 간다 */
export const Route = createFileRoute("/account_/support/")({
  validateSearch: search,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listMySupportInquiries({ data: { page: deps.page ?? 1 } }),
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, m.support_title()) }] }),
  component: SupportList,
});

function SupportList() {
  const page = Route.useLoaderData();
  const newButton = (
    <Link to="/account/support/new" className={buttonClass({ variant: "primary", size: "sm" })}>
      {m.support_new()}
    </Link>
  );
  return (
    <MyPageShell current="support" title={m.support_title()} action={newButton}>
      <div className="flex min-w-0 flex-col gap-4">
        {page.contents.length === 0 ? (
          <EmptyState title={m.support_empty()} />
        ) : (
          <ul className="divide-y divide-line border-ink border-t-2 border-b border-b-line">
            {page.contents.map((inquiry) => (
              <li key={inquiry.inquiryId}>
                <Link
                  to="/account/support/$inquiryId"
                  params={{ inquiryId: inquiry.inquiryId }}
                  className="flex min-w-0 items-center gap-3 px-1 py-4 hover:bg-chip md:px-3"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5 md:flex-row md:items-center md:gap-3">
                    <span className="flex shrink-0 items-center gap-2 text-caption md:w-36">
                      <Badge tone="neutral">{SUPPORT_CATEGORY_LABELS[inquiry.category]}</Badge>
                      <AnswerStatus answered={inquiry.answered} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-body">{inquiry.title}</span>
                    <span className="tabular shrink-0 text-caption text-muted">
                      {formatDateTime(inquiry.createdAt)}
                    </span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Pagination page={page.page} totalPages={page.totalPages} to="/account/support" />
      </div>
    </MyPageShell>
  );
}
