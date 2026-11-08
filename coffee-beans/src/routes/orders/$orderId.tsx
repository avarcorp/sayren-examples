import type { FlowAction, MyOrder, MyOrderItem } from "@sayren/storefront-sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AccountLayout } from "../../components/account/account-layout";
import {
  ClaimSheet,
  type ClaimType,
  claimTypeOfSubflow,
} from "../../components/account/claim-sheet";
import { StatusLabel } from "../../components/account/status-label";
import { LineItem } from "../../components/line-item";
import { Badge, Button, ErrorText, SectionTitle } from "../../components/ui";
import { useClaims, useOrder } from "../../hooks/use-account";
import { m } from "../../i18n";
import { actOnOrderItem, decidePurchase, withdrawClaim } from "../../lib/account-actions";
import { claimsQuery, deliveryQuery, orderQuery } from "../../lib/account-queries";
import { formatDate, formatDateTime, formatMoney, orderNumber } from "../../lib/format";
import { requireMember } from "../../lib/guards";

/**
 * 주문 상세 — 주문상품마다 상태·흐름 행동(actions)·배송조회·구매확정·리뷰 작성, 배송지·결제 금액, 취소·반품 내역.
 * 버튼은 상태 이름이 아니라 서버가 준 actions로 그린다. 취소·반품·교환(subflow)은 클레임 미리보기 뒤 접수한다
 */
export const Route = createFileRoute("/orders/$orderId")({
  beforeLoad: requireMember,
  loader: async ({ context, params }) => {
    const [order] = await Promise.all([
      context.queryClient.ensureQueryData(orderQuery(params.orderId)),
      context.queryClient.ensureQueryData(claimsQuery()),
    ]);
    if (!order) throw notFound();
  },
  component: OrderDetail,
});

function OrderDetail() {
  const { orderId } = Route.useParams();
  const order = useOrder(orderId);
  if (!order) return null;
  return <OrderView order={order} />;
}

function OrderView({ order }: { order: MyOrder }) {
  const claims = useClaims();
  const queryClient = useQueryClient();
  const [sheet, setSheet] = useState<{
    orderItemId: string;
    productId: string;
    optionName: string | null;
    type: ClaimType;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const no = orderNumber(order.orderNo);
  const itemIds = new Set(order.items.map((item) => item.orderItemId));
  const orderClaims = claims.contents.filter((claim) => itemIds.has(claim.orderItemId));

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["me"] });
  const run = async (action: () => Promise<{ ok: boolean; message?: string }>) => {
    const result = await action();
    if (!result.ok) return setError(result.message ?? null);
    setError(null);
    await refresh();
  };

  const onAction = (item: MyOrderItem, action: FlowAction) => {
    const claim = claimTypeOfSubflow(action.subflow);
    if (claim)
      return setSheet({
        orderItemId: item.orderItemId,
        productId: item.productId,
        optionName: item.optionName,
        type: claim,
      });
    return run(() => actOnOrderItem({ data: { orderItemId: item.orderItemId, key: action.key } }));
  };

  return (
    <AccountLayout title={m.order_detail_title()}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-meta text-sub">
        <span>{formatDate(order.orderedAt)}</span>
        {no ? <span className="tabular">{m.order_number_short({ no })}</span> : null}
        {order.testPayment ? <Badge tone="muted">{m.checkout_test_payment()}</Badge> : null}
      </div>
      {error ? <ErrorText>{error}</ErrorText> : null}

      <ul className="flex flex-col gap-3">
        {order.items.map((item) => (
          <li
            key={item.orderItemId}
            className="flex flex-col gap-3 rounded-card border border-line p-4"
          >
            <div className="flex items-center justify-between">
              <StatusLabel status={item.status} />
              {item.claimStatus ? <Badge tone="muted">{m.order_claim_in_progress()}</Badge> : null}
            </div>
            <LineItem
              name={item.productName}
              thumbnailUrl={item.thumbnailUrl}
              optionName={item.optionName}
              customInputs={item.customInputs}
              quantity={item.quantity}
              totalPrice={item.totalPrice}
              currency={order.currency}
            />
            {item.autoDecisionDate && item.status === "DELIVERED" ? (
              <p className="text-caption text-muted">
                {m.order_auto_decide({ date: formatDate(item.autoDecisionDate) })}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {(item.actions ?? []).map((action) => (
                <Button
                  key={action.key}
                  size="sm"
                  variant="secondary"
                  disabled={!action.enabled}
                  title={action.disabled?.message}
                  onClick={() => onAction(item, action)}
                >
                  {action.label}
                </Button>
              ))}
              {item.status === "DELIVERED" &&
              !item.claimStatus &&
              !(item.actions ?? []).some((a) => a.key === "CONFIRM_PURCHASE") ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    run(() => decidePurchase({ data: { orderItemId: item.orderItemId } }))
                  }
                >
                  {m.order_decide()}
                </Button>
              ) : null}
              {item.reviewWritable ? (
                <Link
                  to="/account/reviews"
                  className="inline-flex min-h-10 items-center rounded-control border border-point px-4 font-semibold text-meta text-point"
                >
                  {m.order_write_review()}
                </Link>
              ) : null}
            </div>
            {(item.actions ?? []).some((a) => !a.enabled && a.disabled?.message) ? (
              <p className="text-caption text-muted">
                {(item.actions ?? []).find((a) => !a.enabled)?.disabled?.message}
              </p>
            ) : null}
            {["DISPATCHED", "DELIVERING", "DELIVERED", "PURCHASE_DECIDED"].includes(item.status) ? (
              <Tracking orderItemId={item.orderItemId} />
            ) : null}
          </li>
        ))}
      </ul>

      {orderClaims.length > 0 ? (
        <section className="flex flex-col gap-3">
          <SectionTitle>{m.order_claims()}</SectionTitle>
          <ul className="flex flex-col gap-2">
            {orderClaims.map((claim) => (
              <li
                key={claim.claimId}
                className="flex items-center justify-between gap-3 rounded-card border border-line p-3 text-meta"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="break-words">{claim.productName}</span>
                  <span className="text-muted">{formatDate(claim.requestedAt)}</span>
                </div>
                {claim.status === "REQUESTED" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => run(() => withdrawClaim({ data: { claimId: claim.claimId } }))}
                  >
                    {m.order_claim_withdraw()}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {order.requiresShipping ? (
        <section className="flex flex-col gap-2">
          <SectionTitle>{m.checkout_shipping()}</SectionTitle>
          <div className="flex flex-col gap-0.5 text-body">
            <p>{order.shippingAddress.receiverName}</p>
            <p className="text-sub tabular">{order.shippingAddress.phone}</p>
            <p className="break-words text-sub">
              ({order.shippingAddress.zipCode}) {order.shippingAddress.address1}{" "}
              {order.shippingAddress.address2 ?? ""}
            </p>
            {order.shippingAddress.deliveryMemo ? (
              <p className="break-words text-meta text-muted">
                {order.shippingAddress.deliveryMemo}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <SectionTitle>{m.order_payment()}</SectionTitle>
        <dl className="flex flex-col gap-2 text-body">
          {order.payment.couponDiscountAmount > 0 ? (
            <div className="flex justify-between">
              <dt className="text-sub">{m.amount_coupon()}</dt>
              <dd className="text-sale tabular">
                -{formatMoney(order.payment.couponDiscountAmount, order.currency)}
              </dd>
            </div>
          ) : null}
          {order.payment.deliveryDiscountAmount > 0 ? (
            <div className="flex justify-between">
              <dt className="text-sub">{m.amount_delivery_discount()}</dt>
              <dd className="text-sale tabular">
                -{formatMoney(order.payment.deliveryDiscountAmount, order.currency)}
              </dd>
            </div>
          ) : null}
          {order.payment.pointAmount > 0 ? (
            <div className="flex justify-between">
              <dt className="text-sub">{m.amount_points()}</dt>
              <dd className="text-sale tabular">
                -{formatMoney(order.payment.pointAmount, order.currency)}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between border-line border-t pt-3">
            <dt className="font-semibold">{m.order_paid_amount()}</dt>
            <dd className="font-bold text-lg tabular">
              {formatMoney(order.payment.totalAmount, order.currency)}
            </dd>
          </div>
        </dl>
        {order.payment.refundedAmount > 0 ? (
          <p className="flex justify-between text-meta">
            <span className="text-muted">{m.order_refunded()}</span>
            <span className="tabular">
              {formatMoney(order.payment.refundedAmount, order.currency)}
            </span>
          </p>
        ) : null}
        {order.payment.receiptUrl ? (
          <a
            href={order.payment.receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="min-h-11 content-center text-meta text-point underline"
          >
            {m.order_receipt()}
          </a>
        ) : null}
      </section>

      {sheet ? (
        <ClaimSheet
          orderItemId={sheet.orderItemId}
          productId={sheet.productId}
          optionName={sheet.optionName}
          type={sheet.type}
          currency={order.currency ?? "KRW"}
          onClose={() => setSheet(null)}
        />
      ) : null}
    </AccountLayout>
  );
}

function Tracking({ orderItemId }: { orderItemId: string }) {
  const [open, setOpen] = useState(false);
  const query = useQuery({ ...deliveryQuery(orderItemId), enabled: open });
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className="min-h-10 w-fit text-meta text-point underline"
        onClick={() => setOpen((v) => !v)}
      >
        {m.order_tracking()}
      </button>
      {open && query.data ? (
        <div className="flex flex-col gap-1 text-meta">
          <p>
            {query.data.carrierName} <span className="tabular">{query.data.trackingNumber}</span>
          </p>
          <ol className="flex flex-col gap-1 border-line border-l pl-3">
            {query.data.trackingEvents.map((event) => (
              <li key={`${event.occurredAt}-${event.status}`} className="text-sub">
                <span className="tabular">{formatDateTime(event.occurredAt)}</span> {event.status} ·{" "}
                {event.location}
              </li>
            ))}
          </ol>
        </div>
      ) : open && query.isFetched && !query.data ? (
        <p className="text-meta text-muted">{m.order_tracking_none()}</p>
      ) : null}
    </div>
  );
}
