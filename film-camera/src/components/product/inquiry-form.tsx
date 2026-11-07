import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { useSession } from "../../hooks/use-account";
import { useAction } from "../../hooks/use-action";
import { m } from "../../i18n";
import { productInquiriesQuery } from "../../lib/queries";
import { createProductInquiry } from "../../lib/shop-actions";
import { Button, Checkbox, Select, TextArea } from "../ui";

const CATEGORIES = ["PRODUCT", "DELIVERY", "RETURN", "EXCHANGE", "ETC"] as const;
const LABEL: Record<(typeof CATEGORIES)[number], () => string> = {
  PRODUCT: () => m.inquiry_category_PRODUCT(),
  DELIVERY: () => m.inquiry_category_DELIVERY(),
  RETURN: () => m.inquiry_category_RETURN(),
  EXCHANGE: () => m.inquiry_category_EXCHANGE(),
  ETC: () => m.inquiry_category_ETC(),
};

/** 상품 문의 작성 — 로그인한 구매자만 쓴다. `productPath`는 로그인 뒤 돌아올 상품 주소 값이다 */
export function InquiryForm({
  productId,
  productPath,
}: {
  productId: string;
  productPath: string;
}) {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await run(() =>
      createProductInquiry({
        data: {
          productId,
          content: String(form.get("content") ?? ""),
          secret: form.get("secret") === "on",
          category: String(form.get("category")) as (typeof CATEGORIES)[number],
        },
      }),
    );
    if (result.ok) {
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: productInquiriesQuery(productId).queryKey });
    }
  };
  if (!session) {
    return (
      <Link
        to="/login"
        search={{ redirect: `/products/${productPath}` }}
        className="text-body text-point-strong underline"
      >
        {m.inquiries_login()}
      </Link>
    );
  }
  if (!open) {
    return (
      <Button variant="secondary" className="self-start" onClick={() => setOpen(true)}>
        {m.inquiries_write()}
      </Button>
    );
  }
  return (
    <form className="flex flex-col gap-4 border border-line p-4" onSubmit={submit}>
      <Select
        id="inquiry-category"
        name="category"
        label={m.inquiries_category()}
        defaultValue="PRODUCT"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {LABEL[c]()}
          </option>
        ))}
      </Select>
      <TextArea
        id="inquiry-content"
        name="content"
        label={m.inquiries_content()}
        required
        maxLength={1000}
        error={error ?? undefined}
      />
      <Checkbox label={m.inquiries_secret_check()} name="secret" />
      <Button type="submit" variant="secondary" className="self-start" disabled={pending}>
        {m.inquiries_submit()}
      </Button>
    </form>
  );
}
