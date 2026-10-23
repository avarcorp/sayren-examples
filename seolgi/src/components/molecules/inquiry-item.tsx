import type { PublicInquiry } from "@sayren/storefront-sdk";
import { Lock } from "lucide-react";
import { formatDate } from "../../lib/dates";

const CATEGORY: Record<string, string> = {
  PRODUCT: "상품",
  DELIVERY: "배송",
  RETURN: "반품",
  EXCHANGE: "교환",
  ETC: "기타",
};

/** 상품 문의 한 개 — 답변 상태·유형·작성자·날짜, 본문(비밀글은 본인만), 답변 */
export function InquiryItem({
  inquiry,
  storeName,
  showProduct = false,
}: {
  inquiry: PublicInquiry;
  storeName: string;
  /** 마이페이지처럼 여러 상품의 문의를 함께 보일 때 상품 이름을 위에 붙인다 */
  showProduct?: boolean;
}) {
  const hidden = inquiry.content === null;
  return (
    <li className="flex flex-col gap-1.5 border-line border-b py-5 text-body">
      {showProduct && inquiry.productName ? (
        <p className="text-caption text-muted">{inquiry.productName}</p>
      ) : null}
      <p className="flex flex-wrap gap-2.5 text-caption text-muted">
        <span className={inquiry.answer ? "font-medium text-primary" : ""}>
          {inquiry.answer ? "답변 완료" : "답변 대기"}
        </span>
        <span>{CATEGORY[inquiry.category] ?? "기타"}</span>
        <span>{inquiry.writerMaskedName}</span>
        <span>{formatDate(inquiry.createdAt)}</span>
      </p>
      <p className={`flex items-center gap-1.5 whitespace-pre-line ${hidden ? "text-muted" : ""}`}>
        {inquiry.secret ? <Lock className="size-3.5 shrink-0" aria-label="비밀글" /> : null}
        {inquiry.content ?? "비밀글입니다."}
      </p>
      {inquiry.answer?.content && !hidden ? (
        <div className="mt-2 flex flex-col gap-1 border-ink border-l pl-3.5">
          <p className="font-medium text-caption">
            {storeName} 답변{" "}
            <span className="font-normal text-muted">{formatDate(inquiry.answer.answeredAt)}</span>
          </p>
          <p className="whitespace-pre-line text-prose text-small">{inquiry.answer.content}</p>
        </div>
      ) : null}
    </li>
  );
}
