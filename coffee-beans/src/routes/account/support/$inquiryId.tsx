import { createFileRoute, notFound } from "@tanstack/react-router";
import { AccountLayout } from "../../../components/account/account-layout";
import { supportCategoryLabel } from "../../../components/account/support-category";
import { Badge, LinkButton } from "../../../components/ui";
import { useSupportItem } from "../../../hooks/use-account";
import { m } from "../../../i18n";
import { supportItemQuery } from "../../../lib/account-queries";
import { formatDate } from "../../../lib/format";
import { requireMember } from "../../../lib/guards";

/** 1:1 문의 상세 — 내용과 답변 */
export const Route = createFileRoute("/account/support/$inquiryId")({
  beforeLoad: requireMember,
  loader: async ({ context, params }) => {
    const inquiry = await context.queryClient.ensureQueryData(supportItemQuery(params.inquiryId));
    if (!inquiry) throw notFound();
  },
  component: SupportDetail,
});

function SupportDetail() {
  const { inquiryId } = Route.useParams();
  const inquiry = useSupportItem(inquiryId);
  if (!inquiry) return null;
  return (
    <AccountLayout title={inquiry.title}>
      <div className="flex items-center gap-2 text-caption text-muted">
        <Badge tone={inquiry.answered ? "point" : "muted"}>
          {inquiry.answered ? m.inquiry_answered() : m.inquiry_waiting()}
        </Badge>
        <span>{supportCategoryLabel(inquiry.category)}</span>
        <span>{formatDate(inquiry.createdAt)}</span>
      </div>
      <p className="whitespace-pre-line break-words text-body">{inquiry.content}</p>
      {inquiry.answer ? (
        <div className="flex flex-col gap-1 border-point border-l-2 pl-3">
          <p className="font-semibold text-meta text-point">{m.support_answer()}</p>
          <p className="whitespace-pre-line break-words text-body text-sub">
            {inquiry.answer.content}
          </p>
          <p className="text-caption text-muted">{formatDate(inquiry.answer.answeredAt)}</p>
        </div>
      ) : (
        <p className="text-meta text-muted">{m.support_waiting()}</p>
      )}
      <LinkButton to="/account/support" variant="secondary" className="w-fit">
        {m.support_back()}
      </LinkButton>
    </AccountLayout>
  );
}
