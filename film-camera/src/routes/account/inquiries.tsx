import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AccountLayout } from "../../components/account/account-layout";
import { InquiryList } from "../../components/product/inquiry-list";
import { m } from "../../i18n";
import { myInquiriesQuery } from "../../lib/account-queries";
import { requireMember } from "../../lib/guards";

export const Route = createFileRoute("/account/inquiries")({
  beforeLoad: requireMember,
  loader: ({ context }) => context.queryClient.ensureQueryData(myInquiriesQuery()),
  component: MyInquiries,
});

function MyInquiries() {
  const inquiries = useSuspenseQuery(myInquiriesQuery()).data;
  return (
    <AccountLayout title={m.my_inquiries_title()}>
      <InquiryList
        inquiries={inquiries.contents}
        emptyMessage={m.my_inquiries_empty()}
        showProduct
      />
    </AccountLayout>
  );
}
