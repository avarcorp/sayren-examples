import type { PublicInquiry } from "@sayren/storefront-sdk";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Lock, MessageCircleQuestion } from "lucide-react";
import { useState } from "react";
import { m } from "../i18n";
import { formatDateTime } from "../lib/format";
import { createProductInquiry } from "../lib/inquiries";
import {
  INQUIRY_CATEGORIES,
  INQUIRY_CATEGORY_LABELS,
  type InquiryCategory,
} from "../lib/inquiry-category";
import { productPathParam } from "../lib/product-path";
import { ProductThumb } from "./product-thumb";
import { SubmitButton } from "./submit-button";
import { buttonClass, choiceClass, inputClass } from "./ui/button";
import { SectionHeader } from "./ui/section";

const MAX_LENGTH = 1000;

/**
 * 상품 Q&A 탭 — 「상품 Q&A 작성하기」(회원만, 비회원은 로그인으로)·「내 Q&A 보기」, 열 목록(답변 상태·제목·작성자·작성일),
 * 비밀글 잠금, 누르면 질문·답변이 펼쳐진다. 문의가 없으면 안내와 전폭 버튼을 보인다.
 */
export function ProductQna({
  productId,
  productPath = productId,
  data,
  loggedIn,
  writeSignal = 0,
}: {
  productId: string;
  /** 상품 주소의 경로 값(상품번호) — 로그인 뒤 돌아올 곳이다. 문의 등록은 `productId`로 한다 */
  productPath?: string;
  data: { contents: PublicInquiry[]; totalElements: number } | null;
  loggedIn: boolean;
  /** 바깥(하단 막대·판매자 카드의 문의 버튼)에서 작성 폼을 열 때 올리는 값 */
  writeSignal?: number;
}) {
  const navigate = useNavigate();
  const [writing, setWriting] = useState(false);
  const [lastSignal, setLastSignal] = useState(writeSignal);
  if (writeSignal !== lastSignal) {
    setLastSignal(writeSignal);
    if (loggedIn) setWriting(true);
  }
  if (!data) return null;
  const startWriting = () => {
    if (!loggedIn) {
      void navigate({ to: "/login", search: { redirectTo: `/products/${productPath}` } });
      return;
    }
    setWriting(true);
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <SectionHeader
        title={m.qna_title()}
        count={data.totalElements}
        action={
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={startWriting}
              className={buttonClass({ variant: "primary", size: "xs" })}
            >
              {m.qna_write()}
            </button>
            <Link
              to="/account/inquiries"
              className={buttonClass({ variant: "subtle", size: "xs" })}
            >
              {m.qna_mine()}
            </Link>
          </div>
        }
      />
      {!loggedIn ? <p className="text-caption text-muted">{m.inquiry_login_required()}</p> : null}
      {writing ? (
        <InquiryForm
          productId={productId}
          productPath={productPath}
          onDone={() => setWriting(false)}
        />
      ) : null}
      {data.contents.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-line px-4 py-12 text-center">
          <MessageCircleQuestion
            aria-hidden="true"
            className="size-10 text-line-strong"
            strokeWidth={1.2}
          />
          <p className="font-bold text-body-lg">{m.qna_empty_title()}</p>
          <button
            type="button"
            onClick={startWriting}
            className={buttonClass({
              variant: "outline",
              size: "md",
              className: "mt-1 w-full max-w-xs",
            })}
          >
            {m.qna_empty_cta()}
          </button>
        </div>
      ) : (
        <div>
          <div
            aria-hidden="true"
            className="hidden grid-cols-[6rem_minmax(0,1fr)_6rem_8rem] gap-3 border-ink border-t-2 border-b border-b-line bg-chip px-3 py-2.5 text-caption text-sub md:grid"
          >
            <span>{m.qna_col_status()}</span>
            <span>{m.qna_col_title()}</span>
            <span>{m.qna_col_writer()}</span>
            <span>{m.qna_col_date()}</span>
          </div>
          <ul className="divide-y divide-line border-line border-b max-md:border-ink max-md:border-t-2">
            {data.contents.map((inquiry) => (
              <QnaRow key={inquiry.inquiryId} inquiry={inquiry} />
            ))}
          </ul>
          {data.totalElements > data.contents.length ? (
            <p className="pt-3 text-caption text-muted">
              {m.inquiry_more({ count: data.totalElements, shown: data.contents.length })}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** Q&A 한 줄 — 다른 사람의 비밀글은 펼칠 수 없다(서버도 내용을 비워 보낸다) */
function QnaRow({ inquiry }: { inquiry: PublicInquiry }) {
  const [open, setOpen] = useState(false);
  const panelId = `qna-${inquiry.inquiryId}`;
  const hidden = inquiry.secret && !inquiry.mine;
  const title = hidden ? m.qna_secret_title() : (inquiry.content ?? "").split("\n")[0];
  const status = inquiry.answer
    ? m.product_blocks_inquiry_answered()
    : m.product_blocks_inquiry_waiting();
  return (
    <li className="text-body">
      <button
        type="button"
        disabled={hidden}
        aria-expanded={hidden ? undefined : open}
        aria-controls={hidden ? undefined : panelId}
        onClick={() => setOpen((value) => !value)}
        className="grid w-full min-w-0 grid-cols-[auto_auto_minmax(0,1fr)] gap-x-2 gap-y-1 px-1 py-3.5 text-left disabled:cursor-default md:grid-cols-[6rem_minmax(0,1fr)_6rem_8rem] md:gap-x-3 md:px-3"
      >
        <span
          className={`order-2 text-caption md:order-none ${inquiry.answer ? "font-bold text-ink" : "text-muted"}`}
        >
          {status}
        </span>
        <span className="order-1 col-span-3 flex min-w-0 items-center gap-1.5 md:order-none md:col-span-1">
          {inquiry.secret ? (
            <Lock aria-hidden="true" className="size-3.5 shrink-0 text-muted" strokeWidth={1.6} />
          ) : null}
          <span className="shrink-0 text-caption text-muted">
            [{INQUIRY_CATEGORY_LABELS[inquiry.category]}]
          </span>
          <span className={`truncate ${hidden ? "text-muted" : ""}`}>{title}</span>
          {inquiry.mine ? (
            <span className="inline-flex h-5 shrink-0 items-center bg-ink px-1.5 font-bold text-[0.6875rem] text-white">
              {m.inquiry_mine_badge()}
            </span>
          ) : null}
        </span>
        <span className="order-3 text-caption text-muted md:order-none">
          {inquiry.writerMaskedName}
        </span>
        <span className="order-4 text-caption text-muted md:order-none">
          {formatDateTime(inquiry.createdAt)}
        </span>
      </button>
      {open && !hidden ? (
        <div id={panelId} className="flex flex-col gap-3 bg-chip px-4 py-4 text-meta">
          <p className="flex gap-2.5">
            <strong className="shrink-0">{m.qna_question()}</strong>
            <span className="min-w-0 whitespace-pre-line break-words">{inquiry.content}</span>
          </p>
          <p className="flex gap-2.5">
            <strong className="shrink-0">{m.qna_answer()}</strong>
            <span className="min-w-0 whitespace-pre-line break-words">
              {inquiry.answer
                ? (inquiry.answer.content ?? m.inquiry_answer_secret())
                : m.product_blocks_inquiry_waiting()}
            </span>
          </p>
        </div>
      ) : null}
    </li>
  );
}

/** 문의 한 건 — 다른 사람의 비밀글은 내용 대신 안내를 보인다(서버도 내용을 비워 보낸다) */
export function InquiryItem({
  inquiry,
  showProduct = false,
}: {
  inquiry: PublicInquiry;
  /** 「내 상품 문의」처럼 여러 상품의 문의를 모을 때 상품 썸네일·이름·링크를 보인다 */
  showProduct?: boolean;
}) {
  const hidden = inquiry.secret && !inquiry.mine;
  return (
    <li className="space-y-2 py-4 text-sm">
      {showProduct ? <InquiryProduct inquiry={inquiry} /> : null}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="border border-line px-1.5 py-0.5">
          {INQUIRY_CATEGORY_LABELS[inquiry.category]}
        </span>
        <span className={inquiry.answer ? "font-semibold text-point" : "text-muted"}>
          {inquiry.answer
            ? m.product_blocks_inquiry_answered()
            : m.product_blocks_inquiry_waiting()}
        </span>
        {inquiry.secret ? (
          <span className="border border-line px-1.5 py-0.5">{m.inquiry_secret_badge()}</span>
        ) : null}
        {inquiry.mine ? (
          <span className="bg-ink px-1.5 py-0.5 text-white">{m.inquiry_mine_badge()}</span>
        ) : null}
        <span className="text-muted">
          {inquiry.writerMaskedName} · {formatDateTime(inquiry.createdAt)}
        </span>
      </div>
      <p className={hidden ? "text-muted" : "whitespace-pre-line"}>
        {hidden ? m.product_blocks_inquiry_secret() : (inquiry.content ?? "")}
      </p>
      {inquiry.answer ? (
        <div className="space-y-1 bg-chip p-3">
          <p className="font-semibold text-xs">
            {m.inquiry_answer_label()} · {formatDateTime(inquiry.answer.answeredAt)}
          </p>
          <p className="whitespace-pre-line text-sm">
            {inquiry.answer.content ?? m.inquiry_answer_secret()}
          </p>
        </div>
      ) : null}
    </li>
  );
}

/** 문의한 상품 — 썸네일·이름, 상품이 남아 있으면 상세로 가는 링크 */
function InquiryProduct({ inquiry }: { inquiry: PublicInquiry }) {
  const body = (
    <>
      <ProductThumb
        src={inquiry.thumbnailUrl}
        alt=""
        className="size-12 shrink-0 bg-chip object-cover"
        loading="lazy"
      />
      <span className="line-clamp-2 font-semibold">
        {inquiry.productName ?? m.inquiry_product_deleted()}
      </span>
    </>
  );
  return inquiry.productId && inquiry.productName ? (
    <Link
      to="/products/$productId"
      params={{ productId: productPathParam({ productId: inquiry.productId }) }}
      className="flex items-center gap-3 hover:underline"
    >
      {body}
    </Link>
  ) : (
    <div className="flex items-center gap-3 text-muted">{body}</div>
  );
}

function InquiryForm({
  productId,
  productPath,
  onDone,
}: {
  productId: string;
  productPath: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [secret, setSecret] = useState(false);
  const [category, setCategory] = useState<InquiryCategory>("PRODUCT");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const trimmed = content.trim();
  const tooLong = trimmed.length > MAX_LENGTH;

  return (
    <form
      className="flex flex-col gap-3 border border-line p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!trimmed) {
          setMessage({ ok: false, text: m.inquiry_form_required() });
          return;
        }
        if (tooLong) return;
        setPending(true);
        setMessage(null);
        void createProductInquiry({
          data: { productId, body: { content: trimmed, secret, category } },
        })
          .then(async (result) => {
            if (result.loginRequired) {
              await router.navigate({
                to: "/login",
                search: { redirectTo: `/products/${productPath}` },
              });
              return;
            }
            if (!result.ok) {
              setMessage({ ok: false, text: m.inquiry_form_failed() });
              return;
            }
            setContent("");
            setSecret(false);
            setCategory("PRODUCT");
            setMessage({ ok: true, text: m.inquiry_form_done() });
            await router.invalidate();
          })
          .finally(() => setPending(false));
      }}
    >
      <label className="flex flex-col gap-1.5 text-body">
        <span className="font-bold">{m.inquiry_category()}</span>
        <select
          name="category"
          value={category}
          onChange={(event) => setCategory(event.target.value as InquiryCategory)}
          className={inputClass()}
        >
          {INQUIRY_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {INQUIRY_CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-body">
        <span className="font-bold">{m.inquiry_form_label()}</span>
        <textarea
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={m.inquiry_form_placeholder()}
          rows={4}
          className="w-full min-w-0 resize-none border border-line-strong bg-page p-3.5 text-body placeholder:text-muted focus:border-ink focus:outline-none"
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-body">
          <input
            type="checkbox"
            className={choiceClass}
            checked={secret}
            onChange={(event) => setSecret(event.target.checked)}
          />
          {m.inquiry_form_secret()}
        </label>
        <span className={`tabular text-caption ${tooLong ? "text-point" : "text-muted"}`}>
          {tooLong
            ? m.inquiry_form_too_long({ max: MAX_LENGTH })
            : `${trimmed.length}/${MAX_LENGTH}`}
        </span>
      </div>
      {message ? (
        <p role="status" className={`text-body ${message.ok ? "" : "text-point"}`}>
          {message.text}
        </p>
      ) : null}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2">
        <button
          type="button"
          onClick={onDone}
          className={buttonClass({ variant: "subtle", size: "md", block: true })}
        >
          {m.qna_form_cancel()}
        </button>
        <SubmitButton
          disabled={pending || tooLong}
          className={buttonClass({ variant: "primary", size: "md", block: true })}
        >
          {m.inquiry_form_submit()}
        </SubmitButton>
      </div>
    </form>
  );
}
