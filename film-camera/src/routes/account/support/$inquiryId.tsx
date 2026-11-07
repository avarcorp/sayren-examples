import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { AccountLayout } from "../../../components/account/account-layout";
import { SUPPORT_CATEGORY } from "../../../components/account/support-category";
import { ButtonLink, DateText } from "../../../components/ui";
import { m } from "../../../i18n";
import { customerInquiryQuery } from "../../../lib/account-queries";
import { requireMember } from "../../../lib/guards";

export const Route = createFileRoute("/account/support/$inquiryId")({
  beforeLoad: requireMember,
  loader: async ({ context, params }) => {
    const inquiry = await context.queryClient.ensureQueryData(
      customerInquiryQuery(params.inquiryId),
    );
    if (!inquiry) throw notFound();
  },
  component: SupportDetail,
});

function SupportDetail() {
  const { inquiryId } = Route.useParams();
  const inquiry = useSuspenseQuery(customerInquiryQuery(inquiryId)).data;
  if (!inquiry) return null;
  return (
    <AccountLayout title={m.support_title()}>
      <article className="flex flex-col gap-4">
        <header className="flex flex-col gap-1 border-line border-b pb-4">
          <p className="flex flex-wrap gap-x-3 text-meta text-sub">
            <span>{SUPPORT_CATEGORY[inquiry.category]}</span>
            <DateText iso={inquiry.createdAt} withTime />
          </p>
          <h2 className="break-words font-bold text-xl">{inquiry.title}</h2>
        </header>
        <p className="whitespace-pre-line break-words text-body-lg">{inquiry.content}</p>
        <section className="flex flex-col gap-2 border-point border-l-2 pl-4">
          <h3 className="font-semibold text-meta">
            {inquiry.answer ? m.support_answer() : m.support_waiting()}
          </h3>
          {inquiry.answer ? (
            <>
              <p className="whitespace-pre-line break-words text-body">{inquiry.answer.content}</p>
              <p className="text-meta text-sub">
                <DateText iso={inquiry.answer.answeredAt} withTime />
              </p>
            </>
          ) : null}
        </section>
      </article>
      <ButtonLink to="/account/support" variant="secondary" className="self-start">
        {m.common_back()}
      </ButtonLink>
    </AccountLayout>
  );
}
