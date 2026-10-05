import type { CustomerInquiryCategory } from "@sayren/storefront-sdk";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { MyPageShell } from "../components/mypage/my-page-shell";
import { SubmitButton } from "../components/submit-button";
import { buttonClass, inputClass } from "../components/ui/button";
import { m } from "../i18n";
import { createSupportInquiry, getSupportFormData } from "../lib/inquiries";
import { pageTitle } from "../lib/page-title";
import { SUPPORT_CATEGORIES, SUPPORT_CATEGORY_LABELS } from "../lib/support-category";

const search = z.object({
  /** 주문 카드의 「문의하기」 — 관련 주문 상품을 골라 둔다 */
  orderItemId: z.string().optional().catch(undefined),
});

/** 1:1 문의 작성 — 유형·관련 주문 상품(선택)·제목·내용. 등록하면 상세로 간다 */
export const Route = createFileRoute("/account_/support/new")({
  validateSearch: search,
  loader: () => getSupportFormData(),
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, m.support_new()) }] }),
  component: SupportNew,
});

const field = inputClass();
const textarea =
  "w-full min-w-0 border border-line-strong bg-page px-3.5 py-3 text-body text-ink placeholder:text-muted focus:border-ink focus:outline-none";
const label = "flex min-w-0 flex-col gap-2";
const labelText = "font-bold text-body";

function SupportNew() {
  const { orderItems } = Route.useLoaderData();
  const { orderItemId: presetItem } = Route.useSearch();
  // 최근 주문 상품에 없는 값이면 「선택 안 함」으로 둔다
  const defaultItem = orderItems.some((item) => item.orderItemId === presetItem) ? presetItem : "";
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <MyPageShell
      current="support"
      title={m.support_new()}
      back={{ to: "/account/support", label: m.support_back() }}
    >
      <form
        className="flex min-w-0 max-w-2xl flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const orderItemId = String(form.get("orderItemId") ?? "");
          setPending(true);
          setError(null);
          void createSupportInquiry({
            data: {
              category: form.get("category") as CustomerInquiryCategory,
              title: String(form.get("title") ?? "").trim(),
              content: String(form.get("content") ?? "").trim(),
              orderItemId: orderItemId || undefined,
            },
          })
            .then(async (result) => {
              if (!result.inquiryId) {
                setError(m.support_form_failed());
                return;
              }
              await router.navigate({
                to: "/account/support/$inquiryId",
                params: { inquiryId: result.inquiryId },
              });
            })
            .catch(() => setError(m.support_form_failed()))
            .finally(() => setPending(false));
        }}
      >
        <label className={label}>
          <span className={labelText}>{m.support_category()}</span>
          <select name="category" required defaultValue="DELIVERY" className={field}>
            {SUPPORT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {SUPPORT_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          <span className={labelText}>{m.support_order_item()}</span>
          <select name="orderItemId" defaultValue={defaultItem} className={field}>
            <option value="">{m.support_order_item_none()}</option>
            {orderItems.map((item) => (
              <option key={item.orderItemId} value={item.orderItemId}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          <span className={labelText}>{m.support_form_title()}</span>
          <input
            name="title"
            required
            maxLength={100}
            placeholder={m.support_form_title_placeholder()}
            className={field}
          />
        </label>
        <label className={label}>
          <span className={labelText}>{m.support_form_content()}</span>
          <textarea
            name="content"
            required
            maxLength={2000}
            rows={8}
            placeholder={m.support_form_content_placeholder()}
            className={textarea}
          />
        </label>
        {error ? (
          <p role="alert" className="text-body text-point">
            {error}
          </p>
        ) : null}
        <SubmitButton
          disabled={pending}
          className={buttonClass({ variant: "primary", size: "lg", block: true })}
        >
          {m.support_form_submit()}
        </SubmitButton>
      </form>
    </MyPageShell>
  );
}
