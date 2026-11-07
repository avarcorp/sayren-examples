import type { MyOrder } from "@sayren/storefront-sdk";
import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { OrderCard } from "../components/account/order-card";
import { Button, ErrorState, InfoRows, PageHeader, TextField } from "../components/ui";
import { useAction } from "../hooks/use-action";
import { m } from "../i18n";
import { lookupGuestOrder } from "../lib/account-actions";
import { formatMoney } from "../lib/format";

/**
 * 비회원 주문 조회 — 주문 번호·연락처·주문 비밀번호를 폼 본문으로 서버에 보낸다(비밀번호가 URL에 남지 않는다).
 * 401·404는 한 가지 문구로 안내한다(어느 값이 틀렸는지 알리지 않는다)
 */
export const Route = createFileRoute("/guest-order")({
  component: GuestOrder,
});

function GuestOrder() {
  const [order, setOrder] = useState<MyOrder | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { pending, run } = useAction();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage(null);
    const result = await run(() =>
      lookupGuestOrder({
        data: {
          orderNo: String(form.get("orderNo") ?? ""),
          phone: String(form.get("phone") ?? ""),
          orderPassword: String(form.get("orderPassword") ?? ""),
        },
      }),
    );
    if (result.ok) {
      setOrder(result.data);
      return;
    }
    setOrder(null);
    setMessage(
      result.status === 429 && result.retryAfterSeconds
        ? m.guest_retry_after({ minutes: Math.ceil(result.retryAfterSeconds / 60) })
        : m.guest_error(),
    );
  };

  return (
    <main className="mx-auto flex w-full max-w-[32rem] flex-col gap-6">
      <PageHeader title={m.guest_title()} />
      <form className="flex flex-col gap-4" method="post" onSubmit={submit}>
        <TextField
          id="guest-order-no"
          name="orderNo"
          label={m.guest_order_no()}
          required
          inputMode="numeric"
        />
        <TextField
          id="guest-phone"
          name="phone"
          label={m.guest_phone()}
          required
          type="tel"
          inputMode="numeric"
          placeholder={m.field_phone_placeholder()}
        />
        <TextField
          id="guest-password"
          name="orderPassword"
          label={m.guest_password()}
          required
          type="password"
        />
        {message ? <ErrorState message={message} /> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {m.guest_submit()}
        </Button>
      </form>
      {order ? (
        <section className="flex flex-col gap-4">
          <OrderCard order={order} linkToDetail={false} />
          <InfoRows
            rows={[
              {
                label: m.amount_total(),
                value: formatMoney(order.payment.totalAmount, order.currency ?? "KRW"),
              },
              ...(order.shippingAddress.deliveryMemo
                ? [{ label: m.field_memo(), value: order.shippingAddress.deliveryMemo }]
                : []),
            ]}
          />
        </section>
      ) : null}
    </main>
  );
}
