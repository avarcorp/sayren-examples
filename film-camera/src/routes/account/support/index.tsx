import type { CustomerInquiryCategory } from "@sayren/storefront-sdk";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { z } from "zod";
import { AccountLayout } from "../../../components/account/account-layout";
import { SUPPORT_CATEGORIES, SUPPORT_CATEGORY } from "../../../components/account/support-category";
import {
  Button,
  DateText,
  EmptyState,
  ErrorState,
  Select,
  TextArea,
  TextField,
} from "../../../components/ui";
import { useAction } from "../../../hooks/use-action";
import { m } from "../../../i18n";
import { createSupportInquiry } from "../../../lib/account-actions";
import { customerInquiriesQuery, ordersQuery } from "../../../lib/account-queries";
import { requireMember } from "../../../lib/guards";

export const Route = createFileRoute("/account/support/")({
  beforeLoad: requireMember,
  validateSearch: z.object({ orderItemId: z.string().optional() }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(customerInquiriesQuery()),
      context.queryClient.ensureQueryData(ordersQuery(1)),
    ]),
  component: Support,
});

function Support() {
  const { orderItemId } = Route.useSearch();
  const inquiries = useSuspenseQuery(customerInquiriesQuery()).data;
  const orders = useSuspenseQuery(ordersQuery(1)).data;
  const [writing, setWriting] = useState(Boolean(orderItemId));
  const orderItems = orders.contents.flatMap((o) => o.items);
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await run(() =>
      createSupportInquiry({
        data: {
          category: String(form.get("category")) as CustomerInquiryCategory,
          title: String(form.get("title") ?? ""),
          content: String(form.get("content") ?? ""),
          orderItemId: String(form.get("orderItemId") ?? "") || undefined,
        },
      }),
    );
    if (result.ok) {
      setWriting(false);
      await queryClient.invalidateQueries({ queryKey: customerInquiriesQuery().queryKey });
    }
  };

  return (
    <AccountLayout title={m.support_title()}>
      {writing ? (
        <form className="flex flex-col gap-4 border border-line p-4" onSubmit={submit}>
          <Select
            id="support-category"
            name="category"
            label={m.support_category()}
            defaultValue="ETC"
          >
            {SUPPORT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {SUPPORT_CATEGORY[c]}
              </option>
            ))}
          </Select>
          <Select
            id="support-order"
            name="orderItemId"
            label={m.support_order()}
            defaultValue={orderItemId ?? ""}
          >
            <option value="">{m.support_order_none()}</option>
            {orderItems.map((item) => (
              <option key={item.orderItemId} value={item.orderItemId}>
                {item.productName}
              </option>
            ))}
          </Select>
          <TextField
            id="support-subject"
            name="title"
            label={m.support_subject()}
            required
            maxLength={100}
          />
          <TextArea
            id="support-content"
            name="content"
            label={m.support_content()}
            required
            maxLength={2000}
            rows={6}
          />
          {error ? <ErrorState message={error} /> : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {m.support_submit()}
            </Button>
            <Button variant="secondary" onClick={() => setWriting(false)}>
              {m.common_cancel()}
            </Button>
          </div>
        </form>
      ) : (
        <Button className="self-start" onClick={() => setWriting(true)}>
          {m.support_new()}
        </Button>
      )}
      {inquiries.contents.length === 0 ? (
        <EmptyState message={m.support_empty()} />
      ) : (
        <ul className="divide-y divide-line border-line border-y">
          {inquiries.contents.map((inquiry) => (
            <li key={inquiry.inquiryId}>
              <Link
                to="/account/support/$inquiryId"
                params={{ inquiryId: inquiry.inquiryId }}
                className="flex flex-col gap-1 py-4 hover:text-point-strong"
              >
                <span className="flex flex-wrap gap-x-3 text-meta">
                  <span
                    className={inquiry.answered ? "font-semibold text-point-strong" : "text-sub"}
                  >
                    {inquiry.answered ? m.inquiries_answered() : m.support_waiting()}
                  </span>
                  <span className="text-sub">{SUPPORT_CATEGORY[inquiry.category]}</span>
                  <span className="text-sub">
                    <DateText iso={inquiry.createdAt} />
                  </span>
                </span>
                <span className="break-words text-body-lg">{inquiry.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AccountLayout>
  );
}
