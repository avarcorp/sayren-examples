import { createFileRoute, Link } from "@tanstack/react-router";
import { AccountLayout } from "../../components/account/account-layout";
import { InquiryRow } from "../../components/product/inquiry-list";
import { EmptyState } from "../../components/ui";
import { useMyInquiries } from "../../hooks/use-account";
import { m } from "../../i18n";
import { myInquiriesQuery } from "../../lib/account-queries";
import { requireMember } from "../../lib/guards";
import { productPathParam } from "../../lib/product-path";

/** 내 상품 문의 — 문의마다 상품으로 돌아가는 링크 */
export const Route = createFileRoute("/account/inquiries")({
  beforeLoad: requireMember,
  loader: ({ context }) => context.queryClient.ensureQueryData(myInquiriesQuery()),
  component: MyInquiries,
});

function MyInquiries() {
  const inquiries = useMyInquiries();
  return (
    <AccountLayout title={m.account_menu_inquiries()}>
      {inquiries.contents.length === 0 ? (
        <EmptyState message={m.inquiry_empty()} />
      ) : (
        <ul>
          {inquiries.contents.map((inquiry) => (
            <div key={inquiry.inquiryId}>
              {inquiry.productId && inquiry.productName ? (
                <Link
                  to="/products/$productId"
                  params={{
                    productId: productPathParam({ productNo: null, productId: inquiry.productId }),
                  }}
                  className="block min-h-11 content-center break-words pt-3 font-semibold text-meta text-point"
                >
                  {inquiry.productName}
                </Link>
              ) : null}
              <InquiryRow inquiry={inquiry} />
            </div>
          ))}
        </ul>
      )}
    </AccountLayout>
  );
}
