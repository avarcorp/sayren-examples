import type { PublicInquiry } from "@sayren/storefront-sdk";
import { Lock } from "lucide-react";
import { m } from "../../i18n";
import { DateText, EmptyState } from "../ui";

const CATEGORY_LABEL: Record<PublicInquiry["category"], () => string> = {
  PRODUCT: () => m.inquiry_category_PRODUCT(),
  DELIVERY: () => m.inquiry_category_DELIVERY(),
  RETURN: () => m.inquiry_category_RETURN(),
  EXCHANGE: () => m.inquiry_category_EXCHANGE(),
  ETC: () => m.inquiry_category_ETC(),
};

/** 상품 문의 목록 — 비밀글은 본문을 가리고, 답변은 들여 쓴다. 마이페이지 문의 목록도 같이 쓴다 */
export function InquiryList({
  inquiries,
  emptyMessage,
  showProduct = false,
}: {
  inquiries: PublicInquiry[];
  emptyMessage: string;
  showProduct?: boolean;
}) {
  if (inquiries.length === 0) return <EmptyState message={emptyMessage} />;
  return (
    <ul className="divide-y divide-line border-line border-y">
      {inquiries.map((inquiry) => (
        <li key={inquiry.inquiryId} className="flex flex-col gap-2 py-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-meta">
            <span className={inquiry.answer ? "font-semibold text-point-strong" : "text-sub"}>
              {inquiry.answer ? m.inquiries_answered() : m.inquiries_waiting()}
            </span>
            <span className="text-sub">{CATEGORY_LABEL[inquiry.category]()}</span>
            <span className="text-sub">{inquiry.writerMaskedName}</span>
            <span className="text-sub">
              <DateText iso={inquiry.createdAt} />
            </span>
          </div>
          {showProduct && inquiry.productName ? (
            <p className="break-words font-semibold text-body">{inquiry.productName}</p>
          ) : null}
          {inquiry.content === null ? (
            <p className="flex items-center gap-2 text-body-lg text-sub">
              <Lock size={14} aria-hidden="true" />
              {m.inquiries_secret()}
            </p>
          ) : (
            <p className="whitespace-pre-line break-words text-body-lg">{inquiry.content}</p>
          )}
          {inquiry.answer?.content ? (
            <div className="mt-1 border-point border-l-2 pl-3 text-body">
              <p className="font-semibold text-meta">{m.inquiries_answer()}</p>
              <p className="whitespace-pre-line break-words text-sub">{inquiry.answer.content}</p>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
