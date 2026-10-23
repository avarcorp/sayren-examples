import type { PublicInquiry } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "../atoms/button";
import { Checkbox } from "../atoms/checkbox";
import { InquiryItem } from "../molecules/inquiry-item";

/** 상품 문의 구역 — 목록과 작성 칸. 작성은 로그인한 구매자만 한다(비밀글 선택) */
export function Inquiries({
  data,
  loggedIn,
  loginRedirect,
  storeName,
  onSubmit,
}: {
  data: { contents: PublicInquiry[]; totalElements: number } | null;
  loggedIn: boolean;
  loginRedirect: string;
  storeName: string;
  onSubmit: (input: { content: string; secret: boolean }) => Promise<string | null>;
}) {
  const [writing, setWriting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 id="qna-title" className="font-medium text-title">
          상품 문의 {data?.totalElements ? data.totalElements : ""}
        </h2>
        {loggedIn ? (
          <Button variant="text" onClick={() => setWriting((v) => !v)} aria-expanded={writing}>
            문의 작성
          </Button>
        ) : (
          <Link
            to="/login"
            search={{ redirectTo: loginRedirect }}
            className="py-2 text-small underline underline-offset-4"
          >
            로그인 후 문의 작성
          </Link>
        )}
      </div>
      {writing ? (
        <form
          className="flex flex-col gap-3 border-ink border-t pt-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            setBusy(true);
            const message = await onSubmit({
              content: String(fd.get("content") ?? ""),
              secret: fd.get("secret") === "on",
            });
            setBusy(false);
            setError(message);
            if (!message) {
              form.reset();
              setWriting(false);
            }
          }}
        >
          <label htmlFor="inquiry-content" className="font-medium text-small">
            문의 내용
          </label>
          <textarea
            id="inquiry-content"
            name="content"
            required
            maxLength={1000}
            rows={4}
            placeholder="사이즈·배송 등 궁금한 점을 남기십시오. 연락처 같은 개인정보는 적지 않습니다."
            className="w-full border border-line-strong p-3 text-body outline-none focus:border-ink"
          />
          <div className="flex items-center justify-between">
            <Checkbox name="secret">비밀글</Checkbox>
            <Button type="submit" size="sm" disabled={busy}>
              문의 남기기
            </Button>
          </div>
          {error ? (
            <p role="alert" className="text-primary text-small">
              {error}
            </p>
          ) : null}
        </form>
      ) : null}
      {data && data.contents.length > 0 ? (
        <ul className="flex flex-col border-ink border-t">
          {data.contents.map((q) => (
            <InquiryItem key={q.inquiryId} inquiry={q} storeName={storeName} />
          ))}
        </ul>
      ) : (
        <p className="border-ink border-t py-10 text-center text-muted">아직 문의가 없습니다.</p>
      )}
    </div>
  );
}
