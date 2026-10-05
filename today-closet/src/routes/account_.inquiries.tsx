import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { MyInquiryItem } from "../components/mypage/my-inquiry-item";
import { MyPageShell } from "../components/mypage/my-page-shell";
import { Pagination, TAB_ROW, tabClass } from "../components/mypage/pagination";
import { EmptyState } from "../components/ui/section";
import { m } from "../i18n";
import { listMyProductInquiries } from "../lib/inquiries";
import { pageTitle } from "../lib/page-title";

const search = z.object({
  page: z.coerce.number().int().min(2).optional().catch(undefined),
  status: z.enum(["answered", "waiting"]).optional().catch(undefined),
});

/** 내 상품 문의 — 상품 상세에서 쓴 문의와 답변. 답변 완료·대기로 거른다 */
export const Route = createFileRoute("/account_/inquiries")({
  validateSearch: search,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    listMyProductInquiries({
      data: {
        page: deps.page ?? 1,
        answered: deps.status ? deps.status === "answered" : undefined,
      },
    }),
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, m.my_inquiries_title()) }] }),
  component: MyInquiries,
});

function MyInquiries() {
  const page = Route.useLoaderData();
  const { status } = Route.useSearch();
  return (
    <MyPageShell current="inquiries" title={m.my_inquiries_title()}>
      <div className="flex min-w-0 flex-col gap-4">
        <nav aria-label={m.my_inquiries_title()} className={TAB_ROW}>
          <Link
            to="/account/inquiries"
            aria-current={status ? undefined : "true"}
            className={tabClass(!status)}
          >
            {m.my_inquiries_filter_all()}
          </Link>
          <Link
            to="/account/inquiries"
            search={{ status: "answered" }}
            aria-current={status === "answered" ? "true" : undefined}
            className={tabClass(status === "answered")}
          >
            {m.my_inquiries_filter_answered()}
          </Link>
          <Link
            to="/account/inquiries"
            search={{ status: "waiting" }}
            aria-current={status === "waiting" ? "true" : undefined}
            className={tabClass(status === "waiting")}
          >
            {m.my_inquiries_filter_waiting()}
          </Link>
        </nav>
        {page.contents.length === 0 ? (
          <EmptyState title={m.my_inquiries_empty()} />
        ) : (
          <ul className="divide-y divide-line border-line border-b">
            {page.contents.map((inquiry) => (
              <MyInquiryItem key={inquiry.inquiryId} inquiry={inquiry} />
            ))}
          </ul>
        )}
        <Pagination page={page.page} totalPages={page.totalPages} to="/account/inquiries" />
      </div>
    </MyPageShell>
  );
}
