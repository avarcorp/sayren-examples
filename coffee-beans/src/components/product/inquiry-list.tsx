import type { PublicInquiry } from "@sayren/storefront-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useState } from "react";
import { m } from "../../i18n";
import { formatDate } from "../../lib/format";
import { createProductInquiry } from "../../lib/shop-actions";
import { Badge, Button, ErrorText, Textarea } from "../ui";

/** 상품 문의 목록과 작성 — 작성은 로그인한 구매자만 */
export function InquiryList({
  productId,
  inquiries,
  signedIn,
}: {
  productId: string;
  inquiries: PublicInquiry[];
  signedIn: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {signedIn ? (
        <InquiryForm productId={productId} />
      ) : (
        <p className="text-meta text-sub">
          <Link
            to="/login"
            search={{
              redirect: typeof window === "undefined" ? undefined : window.location.pathname,
            }}
            className="font-semibold text-point underline"
          >
            {m.nav_login()}
          </Link>{" "}
          {m.inquiry_login_needed()}
        </p>
      )}
      {inquiries.length === 0 ? (
        <p className="py-6 text-center text-meta text-muted">{m.inquiry_empty()}</p>
      ) : (
        <ul>
          {inquiries.map((inquiry) => (
            <InquiryRow key={inquiry.inquiryId} inquiry={inquiry} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function InquiryRow({ inquiry }: { inquiry: PublicInquiry }) {
  const hidden = inquiry.content === null;
  return (
    <li className="flex flex-col gap-1.5 border-line border-t py-4">
      <div className="flex flex-wrap items-center gap-2 text-caption text-muted">
        <Badge tone={inquiry.answer ? "point" : "muted"}>
          {inquiry.answer ? m.inquiry_answered() : m.inquiry_waiting()}
        </Badge>
        <span>{inquiry.writerMaskedName}</span>
        <span>{formatDate(inquiry.createdAt)}</span>
      </div>
      <p className="flex items-center gap-1 whitespace-pre-line break-words text-body">
        {hidden ? (
          <>
            <Lock className="size-3.5 shrink-0 text-muted" />
            <span className="text-muted">{m.inquiry_secret()}</span>
          </>
        ) : (
          inquiry.content
        )}
      </p>
      {inquiry.answer?.content ? (
        <div className="mt-1 border-point border-l-2 pl-3 text-meta text-sub">
          <p className="whitespace-pre-line break-words">{inquiry.answer.content}</p>
        </div>
      ) : null}
    </li>
  );
}

function InquiryForm({ productId }: { productId: string }) {
  const [content, setContent] = useState("");
  const [secret, setSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const queryClient = useQueryClient();
  const submit = async () => {
    if (!content.trim()) return setError(m.inquiry_content_needed());
    setPending(true);
    const result = await createProductInquiry({
      data: { productId, content: content.trim(), secret, category: "PRODUCT" },
    });
    setPending(false);
    if (!result.ok) return setError(result.message);
    setContent("");
    setDone(true);
    setError(null);
    await queryClient.invalidateQueries({ queryKey: ["catalog", "product"] });
  };
  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={content}
        maxLength={1000}
        placeholder={m.inquiry_placeholder()}
        aria-label={m.inquiry_write()}
        onChange={(event) => {
          setContent(event.target.value);
          setDone(false);
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <label className="flex min-h-11 items-center gap-2 text-meta">
          <input
            type="checkbox"
            className="size-4 accent-point"
            checked={secret}
            onChange={(e) => setSecret(e.target.checked)}
          />
          {m.inquiry_secret_label()}
        </label>
        <Button size="sm" disabled={pending} onClick={submit}>
          {m.inquiry_submit()}
        </Button>
      </div>
      {error ? <ErrorText>{error}</ErrorText> : null}
      {done ? (
        <p role="status" className="text-meta text-point">
          {m.inquiry_done()}
        </p>
      ) : null}
    </div>
  );
}
