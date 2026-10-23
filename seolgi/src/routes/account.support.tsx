import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "../components/atoms/button";
import { inputClass } from "../components/atoms/text-input";
import { Pagination } from "../components/molecules/pagination";
import { SectionTitle } from "../components/molecules/section-title";
import { AccountTitle } from "../components/templates/account-template";
import { createSupportFn, getSupportFn } from "../lib/account";
import { formatDate } from "../lib/dates";

const CATEGORIES = [
  { value: "DELIVERY", label: "배송" },
  { value: "RETURN", label: "반품" },
  { value: "EXCHANGE", label: "교환" },
  { value: "PAYMENT", label: "결제" },
  { value: "ETC", label: "기타" },
] as const;

export const Route = createFileRoute("/account/support")({
  validateSearch: z.object({ page: z.number().int().min(1).optional().catch(undefined) }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getSupportFn({ data: deps }),
  head: () => ({ meta: [{ title: "1:1 문의 | 설기로운" }] }),
  component: Support,
});

/** 1:1 문의 — 새 문의(유형·제목·내용)와 남긴 문의·답변 */
function Support() {
  const page = Route.useLoaderData();
  const router = useRouter();
  const [writing, setWriting] = useState(page.totalElements === 0);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <AccountTitle title="1:1 문의" aside={`${page.totalElements}건`} />
      <section aria-labelledby="new-title" className="flex flex-col gap-5">
        <SectionTitle
          id="new-title"
          title="새 문의"
          action={
            <button
              type="button"
              className="h-9 text-small underline underline-offset-[3px]"
              aria-expanded={writing}
              onClick={() => setWriting((v) => !v)}
            >
              {writing ? "접기" : "문의 쓰기"}
            </button>
          }
        />
        {writing ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const fd = new FormData(form);
              const r = await createSupportFn({
                data: {
                  category: String(fd.get("category")) as (typeof CATEGORIES)[number]["value"],
                  title: String(fd.get("title") ?? "").trim(),
                  content: String(fd.get("content") ?? "").trim(),
                },
              });
              setError(r.error);
              if (!r.error) {
                form.reset();
                setWriting(false);
                await router.invalidate();
              }
            }}
          >
            <select
              name="category"
              aria-label="문의 유형"
              className="h-12 max-w-[240px] border-0 border-ink border-b bg-transparent text-body"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              name="title"
              aria-label="제목"
              placeholder="제목"
              required
              maxLength={100}
              className={inputClass}
            />
            <textarea
              name="content"
              aria-label="내용"
              placeholder="주문번호와 함께 남기면 더 빨리 답합니다. 연락처 같은 개인정보는 적지 않습니다."
              required
              maxLength={2000}
              rows={5}
              className="border border-line-strong p-3 text-body outline-none focus:border-ink"
            />
            {error ? (
              <p role="alert" className="text-primary text-small">
                {error}
              </p>
            ) : null}
            <Button type="submit" size="sm" className="self-start">
              문의 남기기
            </Button>
          </form>
        ) : null}
      </section>
      <ul className="flex flex-col border-ink border-t">
        {page.contents.map((q) => (
          <li key={q.inquiryId} className="border-line border-b">
            <button
              type="button"
              aria-expanded={open === q.inquiryId}
              onClick={() => setOpen(open === q.inquiryId ? null : q.inquiryId)}
              className="flex w-full flex-col gap-1 py-5 text-left text-body"
            >
              <span className="flex gap-2.5 text-caption text-muted">
                <span className={q.answered ? "font-medium text-primary" : ""}>
                  {q.answered ? "답변 완료" : "답변 대기"}
                </span>
                {CATEGORIES.find((c) => c.value === q.category)?.label}
                <span>{formatDate(q.createdAt)}</span>
              </span>
              {q.title}
            </button>
            {open === q.inquiryId ? (
              <div className="flex flex-col gap-3 pb-5 text-body">
                <p className="whitespace-pre-line text-prose">{q.content}</p>
                {q.answer ? (
                  <div className="border-ink border-l pl-3.5">
                    <p className="font-medium text-caption">
                      답변 · {formatDate(q.answer.answeredAt)}
                    </p>
                    <p className="whitespace-pre-line text-prose text-small">{q.answer.content}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <Pagination page={page.page} totalPages={page.totalPages} />
    </>
  );
}
