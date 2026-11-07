import type { MyOrder } from "@sayren/storefront-sdk";
import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { OrderDetail } from "../components/account/order-detail";
import { Button } from "../components/ui/button";
import { TextField } from "../components/ui/fields";
import { Container, PageTitle } from "../components/ui/page-title";
import { m } from "../i18n";
import { lookupGuestOrder } from "../lib/account-actions";

/** 비회원 주문 조회 — 주문번호·연락처·주문 비밀번호를 POST 본문으로만 보낸다(URL에 남기지 않는다) */
export const Route = createFileRoute("/guest-order")({
  head: () => ({ meta: [{ title: m.nav_guest_order() }] }),
  component: GuestOrderPage,
});

function GuestOrderPage() {
  const [form, setForm] = useState({ orderNo: "", phone: "", orderPassword: "" });
  const [order, setOrder] = useState<MyOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const result = await lookupGuestOrder({ data: form }).catch(() => null);
    if (result?.ok) setOrder(result.order);
    else setError(m.guest_order_not_found());
  };

  return (
    <Container className={order ? "max-w-3xl" : "max-w-md"}>
      <PageTitle>{m.nav_guest_order()}</PageTitle>
      {order ? (
        <OrderDetail order={order} onChanged={() => undefined} allowActions={false} />
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <TextField
            label={m.order_no()}
            name="orderNo"
            inputMode="numeric"
            required
            value={form.orderNo}
            onChange={(e) => setForm({ ...form, orderNo: e.target.value })}
          />
          <TextField
            label={m.guest_phone()}
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <TextField
            label={m.guest_password()}
            name="orderPassword"
            type="password"
            required
            value={form.orderPassword}
            onChange={(e) => setForm({ ...form, orderPassword: e.target.value })}
          />
          {error ? (
            <p role="alert" className="text-meta text-sale">
              {error}
            </p>
          ) : null}
          <Button type="submit">{m.guest_order_submit()}</Button>
        </form>
      )}
    </Container>
  );
}
