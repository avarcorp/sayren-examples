import { createFileRoute } from "@tanstack/react-router";
import { AnswerStatus } from "../components/mypage/my-inquiry-item";
import { MyPageShell } from "../components/mypage/my-page-shell";
import { Badge } from "../components/ui/badge";
import { m } from "../i18n";
import { formatDateTime } from "../lib/format";
import { getMySupportInquiry } from "../lib/inquiries";
import { pageTitle } from "../lib/page-title";
import { SUPPORT_CATEGORY_LABELS } from "../lib/support-category";

/** 1:1 문의 상세 — 내가 쓴 내용과 셀러 답변 */
export const Route = createFileRoute("/account_/support/$inquiryId")({
  loader: ({ params }) => getMySupportInquiry({ data: { inquiryId: params.inquiryId } }),
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, m.support_detail_title()) }] }),
  component: SupportDetail,
});

function SupportDetail() {
  const inquiry = Route.useLoaderData();
  return (
    <MyPageShell
      current="support"
      title={m.support_detail_title()}
      back={{ to: "/account/support", label: m.support_back() }}
    >
      <article className="flex min-w-0 flex-col gap-4 border-ink border-t-2 pt-5">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption">
          <Badge tone="neutral">{SUPPORT_CATEGORY_LABELS[inquiry.category]}</Badge>
          <AnswerStatus answered={inquiry.answered} />
          <span className="tabular text-muted">{formatDateTime(inquiry.createdAt)}</span>
        </p>
        <h2 className="break-words font-bold text-lg">{inquiry.title}</h2>
        <p className="whitespace-pre-line break-words border-line border-b pb-6 text-body leading-relaxed">
          {inquiry.content}
        </p>
      </article>
      <section aria-labelledby="support-answer" className="flex min-w-0 flex-col gap-2 bg-chip p-5">
        <h2 id="support-answer" className="font-bold text-body">
          {m.inquiry_answer_label()}
        </h2>
        {inquiry.answer ? (
          <>
            <p className="tabular text-caption text-muted">
              {formatDateTime(inquiry.answer.answeredAt)}
            </p>
            <p className="whitespace-pre-line break-words text-body leading-relaxed">
              {inquiry.answer.content}
            </p>
          </>
        ) : (
          <p className="text-body text-sub">{m.support_answer_waiting()}</p>
        )}
      </section>
    </MyPageShell>
  );
}
