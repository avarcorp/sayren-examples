import { formatOrderNo, type MyOrder, type MyOrderItem } from "@sayren/storefront-sdk";
import { useState } from "react";
import { m } from "../../i18n";
import { runOrderAction } from "../../lib/account-actions";
import { Button } from "../ui/button";
import { MoneyRow, SummaryBox } from "../ui/money";
import { CLAIM_LABELS, type ClaimKind, ClaimSheet } from "./claim-sheet";
import { OrderItemRow } from "./order-item-row";

const CLAIM_OF: Record<string, ClaimKind> = {
  CANCEL: "CANCEL",
  CANCEL_REQUEST: "CANCEL",
  RETURN_REQUEST: "RETURN",
  EXCHANGE_REQUEST: "EXCHANGE",
};

const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );

/** 주문 상세 본문 — 회원 주문 상세와 비회원 주문 조회가 함께 쓴다. 버튼은 서버의 actions·claimable로만 그린다 */
export function OrderDetail({
  order,
  onChanged,
  allowActions = true,
}: {
  order: MyOrder;
  onChanged: () => void;
  allowActions?: boolean;
}) {
  return (
    <div className="flex flex-col gap-8">
      <p className="text-meta text-sub">
        {dateTime(order.orderedAt)} ·{" "}
        <span className="tabular">{formatOrderNo(order.orderNo)}</span>
      </p>
      <section aria-labelledby="order-items">
        <h2 id="order-items" className="pb-3 font-semibold text-body-lg">
          {m.order_items()}
        </h2>
        <ul className="border-line border-t">
          {order.items.map((item) => (
            <OrderItemRow key={item.orderItemId} item={item} currency={order.currency}>
              {allowActions ? <ItemActions item={item} onChanged={onChanged} /> : null}
            </OrderItemRow>
          ))}
        </ul>
      </section>
      {order.requiresShipping ? (
        <section aria-labelledby="order-address">
          <h2 id="order-address" className="pb-3 font-semibold text-body-lg">
            {m.checkout_address()}
          </h2>
          <dl className="flex flex-col gap-1 border-line border-t pt-3 text-meta">
            <dd>
              {order.shippingAddress.receiverName} · {order.shippingAddress.phone}
            </dd>
            <dd className="break-words text-sub">
              ({order.shippingAddress.zipCode}) {order.shippingAddress.address1}{" "}
              {order.shippingAddress.address2 ?? ""}
            </dd>
            {order.shippingAddress.deliveryMemo ? (
              <dd className="text-sub">{order.shippingAddress.deliveryMemo}</dd>
            ) : null}
          </dl>
        </section>
      ) : null}
      <section aria-labelledby="order-payment">
        <h2 id="order-payment" className="pb-3 font-semibold text-body-lg">
          {m.order_payment()}
        </h2>
        <SummaryBox>
          {order.payment.couponDiscountAmount > 0 ? (
            <MoneyRow
              label={m.amount_coupon()}
              amount={order.payment.couponDiscountAmount}
              currency={order.currency}
              sign="-"
            />
          ) : null}
          {order.payment.pointAmount > 0 ? (
            <MoneyRow
              label={m.amount_points()}
              amount={order.payment.pointAmount}
              currency={order.currency}
              sign="-"
            />
          ) : null}
          {order.payment.pointRefundedAmount > 0 ? (
            <MoneyRow
              label={m.order_point_refunded()}
              amount={order.payment.pointRefundedAmount}
              currency={order.currency}
            />
          ) : null}
          {order.payment.refundedAmount > 0 ? (
            <MoneyRow
              label={m.order_refunded()}
              amount={order.payment.refundedAmount}
              currency={order.currency}
            />
          ) : null}
          <MoneyRow
            label={m.amount_pay()}
            amount={order.payment.totalAmount}
            currency={order.currency}
            strong
          />
        </SummaryBox>
        {order.testPayment ? (
          <p className="pt-2 text-caption text-muted">{m.order_test()}</p>
        ) : null}
      </section>
    </div>
  );
}

function ItemActions({ item, onChanged }: { item: MyOrderItem; onChanged: () => void }) {
  const [claim, setClaim] = useState<ClaimKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const actions = (item.actions ?? []).filter((a) => !a.subflow);
  const claims = Array.from(
    new Set((item.step?.claimable ?? []).map((c) => CLAIM_OF[c.action]).filter(Boolean)),
  ) as ClaimKind[];
  const delivery = item.step?.data?.delivery;
  if (actions.length === 0 && claims.length === 0 && !delivery) return null;

  return (
    <div className="flex flex-col gap-2">
      {delivery?.trackingNumber ? (
        <p className="text-caption text-sub">
          {delivery.carrierName} {delivery.trackingNumber}
          {delivery.trackingUrl ? (
            <a
              href={delivery.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-2 text-point underline"
            >
              {m.order_track()}
            </a>
          ) : null}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.key}
            variant="secondary"
            className="min-h-11 px-4 text-meta"
            disabled={!action.enabled}
            title={action.disabled?.message}
            onClick={async () => {
              const result = await runOrderAction({
                data: { orderItemId: item.orderItemId, key: action.key },
              }).catch(() => null);
              if (result?.ok) onChanged();
              else setError(result?.message ?? m.common_error_retry());
            }}
          >
            {action.label}
          </Button>
        ))}
        {claims.map((kind) => (
          <Button
            key={kind}
            variant="secondary"
            className="min-h-11 px-4 text-meta"
            onClick={() => setClaim(kind)}
          >
            {CLAIM_LABELS[kind]}
          </Button>
        ))}
      </div>
      {error ? <p className="text-caption text-sale">{error}</p> : null}
      {claim ? (
        <ClaimSheet
          open
          kind={claim}
          orderItemId={item.orderItemId}
          onClose={() => setClaim(null)}
          onDone={() => {
            setClaim(null);
            onChanged();
          }}
        />
      ) : null}
    </div>
  );
}
