import {
  formatOrderNo,
  type MyOrder,
  type MyOrderItem,
  type DeliveryTracking as Tracking,
} from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { formatDateTime } from "../../lib/dates";
import { formatMoney, formatPhone } from "../../lib/format";
import { type ItemAction, itemActions, orderStepIndex } from "../../lib/order-status";
import { paymentMethodText } from "../../lib/orders";
import { buttonClass } from "../atoms/button";
import { OrderItemRow } from "../molecules/order-item-row";
import { OrderSteps } from "../molecules/order-steps";
import { SectionTitle } from "../molecules/section-title";
import { DeliveryTracking } from "../organisms/delivery-tracking";
import { AccountTitle } from "./account-template";

const ACTION_LABEL: Record<ItemAction, string> = {
  track: "배송 조회",
  decide: "구매확정",
  cancel: "취소 신청",
  return: "반품·교환 신청",
  review: "리뷰 쓰기",
};

/**
 * 주문 상세 (시안 DOrder) — 주문번호·일시, 단계 막대, 상품 줄과 버튼, 배송 조회, 배송지, 결제 정보.
 * 버튼은 상품 상태로 정하고(`itemActions`) 결과는 서버가 다시 확인한다.
 */
export function OrderDetailTemplate({
  order,
  tracking,
  busy,
  notice,
  onAction,
  readOnly = false,
}: {
  order: MyOrder;
  /** 비회원 조회처럼 버튼 없이 보이기만 한다 */
  readOnly?: boolean;
  tracking: { item: MyOrderItem; data: Tracking | null } | null;
  busy: boolean;
  notice: string | null;
  onAction: (item: MyOrderItem, action: ItemAction) => void;
}) {
  const step = orderStepIndex(order);
  const p = order.payment;
  return (
    <>
      <AccountTitle
        title="주문 상세"
        aside={`${formatOrderNo(order.orderNo) || order.orderId} · ${formatDateTime(order.orderedAt)}`}
      />
      {step !== null ? <OrderSteps current={step} /> : null}
      {notice ? (
        <p role="status" className="border border-ink px-4 py-3 text-body">
          {notice}
        </p>
      ) : null}
      <section aria-label="주문 상품" className="flex flex-col border-ink border-t">
        {order.items.map((item) => (
          <OrderItemRow
            key={item.orderItemId}
            item={item}
            actions={(readOnly ? [] : itemActions(item)).map((action) =>
              action === "review" ? (
                <Link
                  key={action}
                  to="/account/reviews/write/$orderItemId"
                  params={{ orderItemId: item.orderItemId }}
                  className={buttonClass({ variant: "outline", size: "sm" })}
                >
                  {ACTION_LABEL[action]}
                </Link>
              ) : (
                <button
                  key={action}
                  type="button"
                  disabled={busy}
                  onClick={() => onAction(item, action)}
                  className={buttonClass({
                    variant: action === "decide" ? "primary" : "subtle",
                    size: "sm",
                  })}
                >
                  {ACTION_LABEL[action]}
                </button>
              ),
            )}
          />
        ))}
      </section>
      {tracking ? (
        <DeliveryTracking tracking={tracking.data} productName={tracking.item.productName} />
      ) : null}
      <section className="flex flex-wrap gap-12">
        {order.requiresShipping ? (
          <div className="flex flex-[1_1_280px] flex-col gap-3">
            <SectionTitle id="addr-title" title="배송지" />
            <p className="text-body leading-[1.8]">
              {order.shippingAddress.receiverName} · {formatPhone(order.shippingAddress.phone)}
              <br />({order.shippingAddress.zipCode}) {order.shippingAddress.address1}{" "}
              {order.shippingAddress.address2 ?? ""}
              {order.shippingAddress.deliveryMemo ? (
                <>
                  <br />
                  <span className="text-muted">{order.shippingAddress.deliveryMemo}</span>
                </>
              ) : null}
            </p>
          </div>
        ) : null}
        <div className="flex flex-[1_1_280px] flex-col gap-3">
          <SectionTitle id="pay-title" title="결제 정보" />
          <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-y-2.5 text-body">
            {/* 금액은 주문 응답 값을 줄마다 그대로 보인다(화면에서 더하거나 빼지 않는다) */}
            {p.discounts.map((d) => (
              <div key={d.couponId} className="contents">
                <dt className="text-muted">{d.name}</dt>
                <dd className="text-primary">−{formatMoney(d.discountAmount)}</dd>
              </div>
            ))}
            {p.discounts.length === 0 && p.couponDiscountAmount ? (
              <>
                <dt className="text-muted">쿠폰 할인</dt>
                <dd className="text-primary">−{formatMoney(p.couponDiscountAmount)}</dd>
              </>
            ) : null}
            {p.deliveryDiscountAmount ? (
              <>
                <dt className="text-muted">배송비 할인</dt>
                <dd className="text-primary">−{formatMoney(p.deliveryDiscountAmount)}</dd>
              </>
            ) : null}
            {p.pointAmount ? (
              <>
                <dt className="text-muted">적립금 사용</dt>
                <dd className="text-primary">−{formatMoney(p.pointAmount)}</dd>
              </>
            ) : null}
            <dt className="font-medium">결제 금액 · {paymentMethodText(p)}</dt>
            <dd className="font-bold">{formatMoney(p.totalAmount)}</dd>
            {p.refundedAmount ? (
              <>
                <dt className="text-muted">환불 금액</dt>
                <dd>{formatMoney(p.refundedAmount)}</dd>
              </>
            ) : null}
          </dl>
          {p.receiptUrl ? (
            <a
              href={p.receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="self-start py-2 text-small underline underline-offset-4"
            >
              영수증 보기
            </a>
          ) : null}
          {order.testPayment ? (
            <p className="text-caption text-muted">테스트 결제 주문입니다.</p>
          ) : null}
        </div>
      </section>
    </>
  );
}
