import type { FlowAction, MyOrder } from "@sayren/storefront-sdk";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { claimTypeOfSubflow } from "../components/account/claim-sheet";
import { OrderCard } from "../components/account/order-card";
import { Button, Container, ErrorText, Field, Input, PageTitle } from "../components/ui";
import { m } from "../i18n";
import { guestActOnItem, lookupGuestOrder } from "../lib/account-actions";

/**
 * 비회원 주문 조회 — 주문 번호·연락처·주문 비밀번호를 서버 함수 본문으로 보낸다(URL에 남기지 않는다).
 * 401·404는 한 가지 문구로 안내하고, 429는 기다릴 분을 알린다
 */
export const Route = createFileRoute("/guest-order")({ component: GuestOrder });

function GuestOrder() {
  const [form, setForm] = useState({ orderNo: "", phone: "", orderPassword: "" });
  const [order, setOrder] = useState<MyOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const lookup = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setPending(true);
    const result = await lookupGuestOrder({ data: form });
    setPending(false);
    if (result.ok) {
      setOrder(result.data);
      setError(null);
      return;
    }
    setOrder(null);
    if (result.status === 429 && result.retryAfterSeconds) {
      setError(m.guest_retry_after({ minutes: Math.ceil(result.retryAfterSeconds / 60) }));
    } else if (result.status === 401 || result.status === 404) {
      setError(m.guest_not_found());
    } else {
      setError(result.message);
    }
  };

  const act = async (orderItemId: string, action: FlowAction) => {
    if (!order) return;
    const result = await guestActOnItem({
      data: { ...form, orderId: order.orderId, orderItemId, key: action.key },
    });
    if (!result.ok) return setError(result.message);
    await lookup();
  };

  return (
    <Container className="flex max-w-md flex-col gap-6 pt-5">
      <PageTitle>{m.nav_guest_order()}</PageTitle>
      <form className="flex flex-col gap-4" onSubmit={lookup}>
        <Field label={m.order_number()}>
          <Input
            value={form.orderNo}
            inputMode="numeric"
            required
            onChange={(e) => setForm({ ...form, orderNo: e.target.value })}
          />
        </Field>
        <Field label={m.checkout_phone()}>
          <Input
            value={form.phone}
            inputMode="tel"
            required
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
        <Field label={m.checkout_order_password()}>
          <Input
            type="password"
            value={form.orderPassword}
            required
            autoComplete="off"
            onChange={(e) => setForm({ ...form, orderPassword: e.target.value })}
          />
        </Field>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button type="submit" disabled={pending}>
          {m.guest_lookup()}
        </Button>
      </form>
      {order ? (
        <div className="flex flex-col gap-3">
          <OrderCard order={order} link={false} />
          {order.items.flatMap((item) =>
            (item.actions ?? [])
              .filter(
                (action) => !action.subflow || claimTypeOfSubflow(action.subflow) === "CANCEL",
              )
              .map((action) => (
                <Button
                  key={`${item.orderItemId}-${action.key}`}
                  variant="secondary"
                  disabled={!action.enabled}
                  onClick={() => act(item.orderItemId, action)}
                >
                  {action.label}
                </Button>
              )),
          )}
        </div>
      ) : null}
    </Container>
  );
}
