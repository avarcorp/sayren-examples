import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AccountLayout } from "../components/account/account-layout";
import { EmptyState } from "../components/ui/empty-state";
import { m } from "../i18n";
import { myInquiriesQuery } from "../lib/account-queries";
import { requireMember } from "../lib/require-member";

export const Route = createFileRoute("/account/inquiries")({
  loader: async ({ context }) => {
    await requireMember(context.queryClient, "/account/inquiries");
    return context.queryClient.ensureQueryData(myInquiriesQuery());
  },
  head: () => ({ meta: [{ title: m.footer_inquiries() }] }),
  component: InquiriesPage,
});

function InquiriesPage() {
  const inquiries = useSuspenseQuery(myInquiriesQuery()).data;
  return (
    <AccountLayout title={m.footer_inquiries()}>
      {inquiries.length === 0 ? (
        <EmptyState message={m.inquiries_mine_empty()} />
      ) : (
        <ul className="border-line border-t">
          {inquiries.map((inquiry) => (
            <li
              key={inquiry.inquiryId}
              className="flex flex-col gap-1.5 border-line border-b py-4 text-meta"
            >
              <p className="text-muted">
                {inquiry.productName} ·{" "}
                {inquiry.answer ? m.inquiry_answered() : m.inquiry_waiting()}
              </p>
              <p className="break-words text-body">{inquiry.content}</p>
              {inquiry.answer?.content ? (
                <p className="border-line border-l-2 pl-3 text-sub">{inquiry.answer.content}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </AccountLayout>
  );
}
