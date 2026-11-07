import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { AccountLayout } from "../components/account/account-layout";
import { Button } from "../components/ui/button";
import { EmptyState } from "../components/ui/empty-state";
import { TextField } from "../components/ui/fields";
import { m } from "../i18n";
import { createSupportInquiry } from "../lib/account-actions";
import { supportInquiriesQuery } from "../lib/account-queries";
import { requireMember } from "../lib/require-member";

const dateOf = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(iso));

export const Route = createFileRoute("/account/support")({
  loader: async ({ context }) => {
    await requireMember(context.queryClient, "/account/support");
    return context.queryClient.ensureQueryData(supportInquiriesQuery());
  },
  head: () => ({ meta: [{ title: m.footer_support() }] }),
  component: SupportPage,
});

function SupportPage() {
  const inquiries = useSuspenseQuery(supportInquiriesQuery()).data;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await createSupportInquiry({ data: form }).catch(() => null);
    if (result?.ok) {
      setForm({ title: "", content: "" });
      setOpen(false);
      setMessage(m.inquiry_sent());
      await queryClient.invalidateQueries({ queryKey: supportInquiriesQuery().queryKey });
    } else setMessage(result?.message ?? m.common_error_retry());
  };

  return (
    <AccountLayout title={m.footer_support()}>
      <div className="flex justify-end pb-3">
        <Button variant={open ? "secondary" : "primary"} onClick={() => setOpen((v) => !v)}>
          {open ? m.common_close() : m.support_write()}
        </Button>
      </div>
      {open ? (
        <form onSubmit={submit} className="flex flex-col gap-4 pb-8">
          <TextField
            label={m.support_subject()}
            name="title"
            required
            maxLength={100}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="support-content" className="text-meta text-sub">
              {m.support_content()}
            </label>
            <textarea
              id="support-content"
              required
              rows={6}
              maxLength={2000}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full border border-line-strong p-3 text-body focus:border-point focus:outline-none"
            />
          </div>
          <Button type="submit">{m.support_submit()}</Button>
        </form>
      ) : null}
      {message ? (
        <p role="status" className="pb-4 text-meta text-sub">
          {message}
        </p>
      ) : null}
      {inquiries.length === 0 ? (
        <EmptyState message={m.support_empty()} />
      ) : (
        <ul className="border-line border-t">
          {inquiries.map((inquiry) => (
            <li key={inquiry.inquiryId} className="border-line border-b">
              <button
                type="button"
                className="flex min-h-14 w-full flex-col items-start gap-0.5 py-3 text-left"
                aria-expanded={expanded === inquiry.inquiryId}
                onClick={() =>
                  setExpanded(expanded === inquiry.inquiryId ? null : inquiry.inquiryId)
                }
              >
                <span className="break-words text-body">{inquiry.title}</span>
                <span className="text-caption text-muted">
                  {dateOf(inquiry.createdAt)} ·{" "}
                  {inquiry.answered ? m.inquiry_answered() : m.inquiry_waiting()}
                </span>
              </button>
              {expanded === inquiry.inquiryId ? (
                <div className="flex flex-col gap-2 pb-4 text-meta">
                  <p className="whitespace-pre-line break-words">{inquiry.content}</p>
                  {inquiry.answer ? (
                    <p className="whitespace-pre-line border-line border-l-2 pl-3 text-sub">
                      {inquiry.answer.content}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </AccountLayout>
  );
}
