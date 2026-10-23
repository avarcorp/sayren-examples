import type { MyOrder } from "@sayren/storefront-sdk";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "../components/atoms/button";
import { inputClass } from "../components/atoms/text-input";
import { FormField } from "../components/molecules/form-field";
import { OrderDetailTemplate } from "../components/templates/order-detail-template";
import { lookupGuestOrderFn } from "../lib/orders";

export const Route = createFileRoute("/guest-order")({
  validateSearch: z.object({ orderId: z.string().max(64).optional().catch(undefined) }),
  head: () => ({ meta: [{ title: "비회원 주문 조회 | 설기로운" }] }),
  component: GuestOrder,
});

/** 비회원 주문 조회 — 주문번호·연락처·주문 조회 비밀번호로 찾고, 찾으면 주문 상세를 보인다(읽기만) */
function GuestOrder() {
  const { orderId } = Route.useSearch();
  const [order, setOrder] = useState<MyOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (order) {
    return (
      <div className="flex flex-col gap-12 pt-12 pb-24">
        <OrderDetailTemplate
          order={order}
          tracking={null}
          busy={false}
          notice={null}
          onAction={() => undefined}
          readOnly
        />
        <p className="text-muted text-small">취소·반품은 고객센터로 접수합니다.</p>
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-[400px] flex-col gap-8 pt-16 pb-24">
      <h1 className="font-display text-h2">비회원 주문 조회</h1>
      <form
        className="flex flex-col gap-6"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setBusy(true);
          const r = await lookupGuestOrderFn({
            data: {
              orderRef: String(fd.get("orderRef") ?? ""),
              phone: String(fd.get("phone") ?? ""),
              orderPassword: String(fd.get("orderPassword") ?? ""),
            },
          });
          setBusy(false);
          setOrder(r.order);
          setError(r.error);
        }}
      >
        <FormField id="g-order" label="주문번호" required>
          <input
            id="g-order"
            name="orderRef"
            defaultValue={orderId}
            required
            className={inputClass}
          />
        </FormField>
        <FormField id="g-phone" label="주문할 때 적은 연락처" required>
          <input
            id="g-phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            className={inputClass}
          />
        </FormField>
        <FormField id="g-pw" label="주문 조회 비밀번호" required>
          <input id="g-pw" name="orderPassword" type="password" required className={inputClass} />
        </FormField>
        {error ? (
          <p role="alert" className="text-primary text-small">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" block disabled={busy}>
          주문 조회
        </Button>
      </form>
    </div>
  );
}
