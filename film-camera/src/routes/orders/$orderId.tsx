import {
  formatOrderNo,
  type MyClaim,
  type MyOrder,
  type MyOrderItem,
} from "@sayren/storefront-sdk";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AccountLayout } from "../../components/account/account-layout";
import { type ClaimKind, ClaimSheet } from "../../components/account/claim-sheet";
import { StatusLabel } from "../../components/account/status-label";
import { LineItem } from "../../components/line-item";
import { Button, ButtonLink, DateText, InfoRows, SectionTitle } from "../../components/ui";
import { useAction } from "../../hooks/use-action";
import { lazyMessages, m } from "../../i18n";
import { actOnOrderItem, withdrawClaim } from "../../lib/account-actions";
import { claimsQuery, deliveryQuery, orderQuery } from "../../lib/account-queries";
import { formatMoney } from "../../lib/format";
import { requireMember } from "../../lib/guards";

const METHOD_LABEL = lazyMessages({
  CARD: () => m.payment_method_CARD(),
  EASY_PAY: () => m.payment_method_EASY_PAY(),
  BANK_TRANSFER: () => m.payment_method_BANK_TRANSFER(),
  VIRTUAL_ACCOUNT: () => m.payment_method_VIRTUAL_ACCOUNT(),
  MOBILE: () => m.payment_method_MOBILE(),
});
const CLAIM_KIND: Record<
  "CANCEL" | "CANCEL_REQUEST" | "RETURN_REQUEST" | "EXCHANGE_REQUEST",
  ClaimKind
> = {
  CANCEL: "CANCEL",
  CANCEL_REQUEST: "CANCEL",
  RETURN_REQUEST: "RETURN",
  EXCHANGE_REQUEST: "EXCHANGE",
};
const CLAIM_ACTION_LABEL = lazyMessages({
  CANCEL: () => m.claim_action_CANCEL(),
  CANCEL_REQUEST: () => m.claim_action_CANCEL_REQUEST(),
  RETURN_REQUEST: () => m.claim_action_RETURN_REQUEST(),
  EXCHANGE_REQUEST: () => m.claim_action_EXCHANGE_REQUEST(),
});
const CLAIM_TYPE = lazyMessages({
  CANCEL: () => m.claim_type_CANCEL(),
  RETURN: () => m.claim_type_RETURN(),
  EXCHANGE: () => m.claim_type_EXCHANGE(),
});

const CLAIM_STATUS = lazyMessages({
  REQUESTED: () => m.claim_status_REQUESTED(),
  HELD: () => m.claim_status_HELD(),
  COLLECTING: () => m.claim_status_COLLECTING(),
  COLLECTED: () => m.claim_status_COLLECTED(),
  REDELIVERING: () => m.claim_status_REDELIVERING(),
  APPROVED: () => m.claim_status_APPROVED(),
  REJECTED: () => m.claim_status_REJECTED(),
  COMPLETED: () => m.claim_status_COMPLETED(),
  WITHDRAWN: () => m.claim_status_WITHDRAWN(),
});

export const Route = createFileRoute("/orders/$orderId")({
  beforeLoad: requireMember,
  loader: async ({ context, params }) => {
    const order = await context.queryClient.ensureQueryData(orderQuery(params.orderId));
    if (!order) throw notFound();
    await Promise.all([
      context.queryClient.ensureQueryData(claimsQuery()),
      ...order.items
        .filter((i) => i.status === "DISPATCHED" || i.status === "DELIVERING")
        .map((i) => context.queryClient.ensureQueryData(deliveryQuery(i.orderItemId))),
    ]);
  },
  component: OrderPage,
});

function OrderPage() {
  const { orderId } = Route.useParams();
  const order = useSuspenseQuery(orderQuery(orderId)).data;
  if (!order) return null;
  return <OrderDetail order={order} />;
}

function OrderDetail({ order }: { order: MyOrder }) {
  const claims = useSuspenseQuery(claimsQuery()).data.contents.filter((c) =>
    order.items.some((i) => i.orderItemId === c.orderItemId),
  );
  const [sheet, setSheet] = useState<{ kind: ClaimKind; orderItemId: string } | null>(null);
  const currency = order.currency ?? "KRW";
  const money = (n: number) => formatMoney(n, currency);
  const address = order.shippingAddress;

  return (
    <AccountLayout title={m.order_detail_title()}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-body">
        <span className="tabular font-semibold">
          {m.order_no({ no: formatOrderNo(order.orderNo ?? order.orderId) })}
        </span>
        <span className="text-sub">
          <DateText iso={order.orderedAt} withTime />
        </span>
      </div>
      {order.testPayment ? <p className="text-meta text-sub">{m.order_test_payment()}</p> : null}

      <section aria-labelledby="od-items" className="flex flex-col gap-2">
        <SectionTitle id="od-items">{m.order_items()}</SectionTitle>
        <ul className="divide-y divide-line border-line border-y">
          {order.items.map((item) => (
            <li key={item.orderItemId}>
              <LineItem
                name={item.productName}
                thumbnailUrl={item.thumbnailUrl}
                quantity={item.quantity}
                totalPrice={item.totalPrice}
                currency={currency}
                aside={<StatusLabel item={item} />}
              >
                <ItemActions
                  item={item}
                  onClaim={(kind) => setSheet({ kind, orderItemId: item.orderItemId })}
                />
              </LineItem>
              {item.status === "DISPATCHED" || item.status === "DELIVERING" ? (
                <DeliveryBox orderItemId={item.orderItemId} />
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {claims.length > 0 ? (
        <section aria-labelledby="od-claims" className="flex flex-col gap-2">
          <SectionTitle id="od-claims">{m.order_claims()}</SectionTitle>
          <InfoRows
            rows={claims.map((c) => ({
              label: CLAIM_TYPE[c.type],
              value: <ClaimRow claim={c} />,
            }))}
          />
        </section>
      ) : null}

      {order.requiresShipping ? (
        <section aria-labelledby="od-ship" className="flex flex-col gap-2">
          <SectionTitle id="od-ship">{m.order_shipping()}</SectionTitle>
          <InfoRows
            rows={[
              { label: m.field_receiver(), value: address.receiverName },
              { label: m.field_phone(), value: address.phone },
              {
                label: m.field_address1(),
                value: `(${address.zipCode}) ${address.address1} ${address.address2 ?? ""}`,
              },
              ...(address.deliveryMemo
                ? [{ label: m.field_memo(), value: address.deliveryMemo }]
                : []),
            ]}
          />
        </section>
      ) : null}

      <section aria-labelledby="od-pay" className="flex flex-col gap-2">
        <SectionTitle id="od-pay">{m.order_payment()}</SectionTitle>
        <p className="text-body text-sub">
          {METHOD_LABEL[order.payment.method as keyof typeof METHOD_LABEL] ?? order.payment.method}
          {order.payment.paidAt ? (
            <>
              {" · "}
              <DateText iso={order.payment.paidAt} withTime />
            </>
          ) : null}
        </p>
        <InfoRows
          rows={[
            ...(order.payment.couponDiscountAmount
              ? [
                  {
                    label: m.amount_coupon(),
                    value: m.amount_minus({ amount: money(order.payment.couponDiscountAmount) }),
                  },
                ]
              : []),
            ...(order.payment.pointAmount
              ? [
                  {
                    label: m.amount_point(),
                    value: m.amount_minus({ amount: money(order.payment.pointAmount) }),
                  },
                ]
              : []),
            {
              label: m.amount_total(),
              value: <span className="tabular font-bold">{money(order.payment.totalAmount)}</span>,
            },
          ]}
        />
        {order.payment.receiptUrl ? (
          <a
            href={order.payment.receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="text-body underline"
          >
            {m.order_receipt()}
          </a>
        ) : null}
      </section>

      {sheet ? (
        <ClaimSheet
          kind={sheet.kind}
          orderItemId={sheet.orderItemId}
          currency={currency}
          onClose={() => setSheet(null)}
        />
      ) : null}
    </AccountLayout>
  );
}

function ItemActions({ item, onClaim }: { item: MyOrderItem; onClaim: (kind: ClaimKind) => void }) {
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();
  const claimable = item.step?.claimable ?? [];
  // 클레임(subflow)은 신청 시트로, 조회(VIEW)는 배송 조회 상자로 그린다 — 여기서는 바로 실행하는 행동만 버튼이다
  const actions = (item.actions ?? []).filter((a) => !a.subflow && a.mode !== "VIEW");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["me"] });

  const act = async (key: string) => {
    const result = await run(() =>
      actOnOrderItem({ data: { orderItemId: item.orderItemId, key } }),
    );
    if (result.ok) await refresh();
  };

  return (
    <div className="flex flex-col gap-2 pt-2">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.key}
            variant="secondary"
            disabled={!action.enabled || pending}
            title={action.disabled?.message}
            onClick={() => act(action.key)}
          >
            {action.label}
          </Button>
        ))}
        {claimable.map((c) => (
          <Button key={c.action} variant="secondary" onClick={() => onClaim(CLAIM_KIND[c.action])}>
            {CLAIM_ACTION_LABEL[c.action]}
          </Button>
        ))}
        {item.reviewWritable ? (
          <ButtonLink to="/account/reviews" variant="secondary">
            {m.order_review()}
          </ButtonLink>
        ) : null}
        <Link
          to="/account/support"
          search={{ orderItemId: item.orderItemId }}
          className="inline-flex min-h-11 items-center px-1 text-body text-sub underline"
        >
          {m.order_warranty()}
        </Link>
      </div>
      {error ? (
        <p role="alert" className="text-meta text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function DeliveryBox({ orderItemId }: { orderItemId: string }) {
  const delivery = useSuspenseQuery(deliveryQuery(orderItemId)).data;
  if (!delivery) return null;
  return (
    <div className="mb-4 flex flex-col gap-2 border border-line p-4 text-body">
      <p className="font-semibold">{m.order_track()}</p>
      <p className="tabular text-sub">
        {m.delivery_carrier({ carrier: delivery.carrierName, number: delivery.trackingNumber })}
      </p>
      <ol className="flex flex-col gap-1 text-meta text-sub">
        {delivery.trackingEvents.map((event) => (
          <li key={event.occurredAt} className="flex flex-wrap gap-x-2">
            <DateText iso={event.occurredAt} withTime />
            <span className="text-ink">{event.status}</span>
            <span>{event.location}</span>
          </li>
        ))}
      </ol>
      <a
        href={delivery.trackingUrl}
        target="_blank"
        rel="noreferrer"
        className="text-point-strong underline"
      >
        {m.delivery_open()}
      </a>
    </div>
  );
}

function ClaimRow({ claim }: { claim: MyClaim }) {
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();
  const cancel = async () => {
    const result = await run(() => withdrawClaim({ data: { claimId: claim.claimId } }));
    if (result.ok) await queryClient.invalidateQueries({ queryKey: ["me"] });
  };
  return (
    <span className="flex flex-col gap-1">
      <span>
        {claim.productName} · {CLAIM_STATUS[claim.status]}
      </span>
      {claim.rejectReason ? (
        <span className="text-sub">{m.claim_reject_reason({ reason: claim.rejectReason })}</span>
      ) : null}
      {claim.status === "REQUESTED" ? (
        <button
          type="button"
          className="min-h-11 self-start text-meta underline"
          disabled={pending}
          onClick={cancel}
        >
          {m.claim_withdraw()}
        </button>
      ) : null}
      {error ? <span className="text-danger">{error}</span> : null}
    </span>
  );
}
