import type { PublicInquiry } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { m } from "../../i18n";
import { formatDateTime } from "../../lib/format";
import { INQUIRY_CATEGORY_LABELS } from "../../lib/inquiry-category";
import { productPathParam } from "../../lib/product-path";
import { ProductThumb } from "../product-thumb";
import { Badge } from "../ui/badge";

/** 답변 상태 — 답변 완료는 잉크 굵게, 대기는 회색 */
export function AnswerStatus({ answered }: { answered: boolean }) {
  return (
    <span className={answered ? "font-bold text-ink" : "text-muted"}>
      {answered ? m.support_status_answered() : m.support_status_waiting()}
    </span>
  );
}

/** 내 상품 문의 한 건 — 상품(썸네일·이름·상세 링크), 유형 배지·답변 상태·작성일, 질문, 답변 */
export function MyInquiryItem({ inquiry }: { inquiry: PublicInquiry }) {
  const product = (
    <>
      <ProductThumb
        src={inquiry.thumbnailUrl}
        alt=""
        className="h-15 w-12 shrink-0 bg-chip object-cover"
        loading="lazy"
      />
      <span className="line-clamp-2 min-w-0 break-words text-body">
        {inquiry.productName ?? m.inquiry_product_deleted()}
      </span>
    </>
  );
  return (
    <li className="flex min-w-0 flex-col gap-3 py-5">
      {inquiry.productId && inquiry.productName ? (
        <Link
          to="/products/$productId"
          params={{ productId: productPathParam({ productId: inquiry.productId }) }}
          className="flex min-w-0 items-center gap-3 hover:underline"
        >
          {product}
        </Link>
      ) : (
        <div className="flex min-w-0 items-center gap-3">{product}</div>
      )}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption">
        <Badge tone="neutral">{INQUIRY_CATEGORY_LABELS[inquiry.category]}</Badge>
        {inquiry.secret ? <Badge tone="muted">{m.inquiry_secret_badge()}</Badge> : null}
        <AnswerStatus answered={Boolean(inquiry.answer)} />
        <span className="tabular text-muted">{formatDateTime(inquiry.createdAt)}</span>
      </div>
      <p className="whitespace-pre-line break-words text-body">{inquiry.content ?? ""}</p>
      {inquiry.answer ? (
        <div className="flex flex-col gap-1 bg-chip p-4">
          <p className="font-bold text-meta">
            {m.inquiry_answer_label()}{" "}
            <span className="tabular font-normal text-muted">
              {formatDateTime(inquiry.answer.answeredAt)}
            </span>
          </p>
          <p className="whitespace-pre-line break-words text-body">
            {inquiry.answer.content ?? m.inquiry_answer_secret()}
          </p>
        </div>
      ) : null}
    </li>
  );
}
