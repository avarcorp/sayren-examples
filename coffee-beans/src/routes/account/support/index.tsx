import {
  type CustomerInquiryCategory,
  customerInquiryCategorySchema,
} from "@sayren/storefront-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { AccountLayout } from "../../../components/account/account-layout";
import { supportCategoryLabel } from "../../../components/account/support-category";
import {
  Badge,
  Button,
  EmptyState,
  ErrorText,
  Field,
  Input,
  Select,
  Textarea,
} from "../../../components/ui";
import { useSupport } from "../../../hooks/use-account";
import { m } from "../../../i18n";
import { createSupportInquiry } from "../../../lib/account-actions";
import { supportQuery } from "../../../lib/account-queries";
import { formatDate } from "../../../lib/format";
import { requireMember } from "../../../lib/guards";

/** 1:1 문의 — 목록과 작성 */
export const Route = createFileRoute("/account/support/")({
  beforeLoad: requireMember,
  loader: ({ context }) => context.queryClient.ensureQueryData(supportQuery()),
  component: Support,
});

function Support() {
  const support = useSupport();
  const [writing, setWriting] = useState(false);
  return (
    <AccountLayout title={m.account_menu_support()}>
      {writing ? (
        <SupportForm onDone={() => setWriting(false)} />
      ) : (
        <Button variant="secondary" onClick={() => setWriting(true)}>
          {m.support_write()}
        </Button>
      )}
      {support.contents.length === 0 ? (
        <EmptyState message={m.support_empty()} />
      ) : (
        <ul className="flex flex-col">
          {support.contents.map((inquiry) => (
            <li key={inquiry.inquiryId} className="border-line border-b">
              <Link
                to="/account/support/$inquiryId"
                params={{ inquiryId: inquiry.inquiryId }}
                className="flex min-h-14 items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-center gap-2 text-caption text-muted">
                    <Badge tone={inquiry.answered ? "point" : "muted"}>
                      {inquiry.answered ? m.inquiry_answered() : m.inquiry_waiting()}
                    </Badge>
                    <span>{supportCategoryLabel(inquiry.category)}</span>
                    <span>{formatDate(inquiry.createdAt)}</span>
                  </div>
                  <p className="break-words text-body">{inquiry.title}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AccountLayout>
  );
}

function SupportForm({ onDone }: { onDone: () => void }) {
  const categories = customerInquiryCategorySchema.options;
  const [category, setCategory] = useState<CustomerInquiryCategory>(categories[0]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const submit = async () => {
    if (!title.trim() || !content.trim()) return setError(m.support_fill());
    const result = await createSupportInquiry({
      data: { category, title: title.trim(), content: content.trim() },
    });
    if (!result.ok) return setError(result.message);
    await queryClient.invalidateQueries({ queryKey: ["me", "support"] });
    onDone();
  };
  return (
    <div className="flex flex-col gap-4 rounded-card border border-line p-4">
      <Field label={m.support_category()}>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value as CustomerInquiryCategory)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {supportCategoryLabel(c)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={m.support_title_label()}>
        <Input value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label={m.support_content()}>
        <Textarea value={content} maxLength={2000} onChange={(e) => setContent(e.target.value)} />
      </Field>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onDone}>
          {m.account_cancel()}
        </Button>
        <Button className="flex-1" onClick={submit}>
          {m.support_submit()}
        </Button>
      </div>
    </div>
  );
}
