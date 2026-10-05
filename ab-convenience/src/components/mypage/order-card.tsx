import { formatOrderNo, type MyOrder, type MyOrderItem } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { m } from "../../i18n";
import { formatDateTime, formatPrice } from "../../lib/format";
import {
  canClaim,
  canReview,
  canTrack,
  claimInProgress,
  type OrderItemTone,
  orderItemStatusLabel,
  orderItemTone,
} from "../../lib/order-status";
import { LineOptions } from "../line-options";
import { ProductThumb } from "../product-thumb";
import { buttonClass } from "../ui/button";

const TONE_CLASS: Record<OrderItemTone, string> = {
  info: "text-info",
  point: "text-point",
  muted: "text-muted",
  ink: "text-ink",
};

/** 주문 상품 상태 — 배송 중 info, 취소·반품 point, 구매 확정 muted. 진행 중인 신청이 있으면 함께 적는다 */
export function OrderItemStatus({ item }: { item: MyOrderItem }) {
  const tone = orderItemTone(item.status, item.claimStatus);
  return (
    <span className={`font-bold text-meta ${TONE_CLASS[tone]}`}>
      {item.flowState?.label ?? orderItemStatusLabel(item.status, item.fulfillmentSnapshot)}
      {claimInProgress(item.claimStatus) ? ` · ${m.mypage_claim_in_progress()}` : null}
    </span>
  );
}

/** 주문번호 — 번호 체계 이전 주문은 주문 id다 */
export function orderNoText(order: Pick<MyOrder, "orderId" | "orderNo">): string {
  return order.orderNo ? formatOrderNo(order.orderNo) : order.orderId;
}

/**
 * 주문 상품 한 줄 — 썸네일(모바일 64×80, 데스크톱 80×100)·상태·이름·옵션·수량·금액. 오른쪽(모바일은 아래)에 행동 버튼,
 * 그 아래에 펼침 영역(배송 조회·신청 폼)을 둔다.
 */
export function OrderItemRow({
  item,
  actions,
  meta,
  children,
}: {
  item: MyOrderItem;
  actions?: ReactNode;
  /** 이름 아래 덧붙이는 줄(상품주문번호 등) */
  meta?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 p-4 md:p-5">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div className="flex min-w-0 flex-1 gap-3 md:gap-4">
          <ProductThumb
            src={item.thumbnailUrl}
            alt={item.productName}
            className="h-20 w-16 shrink-0 bg-chip object-cover md:h-25 md:w-20"
            loading="lazy"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <OrderItemStatus item={item} />
            <p className="break-words text-body">{item.productName}</p>
            <LineOptions item={item} />
            <p className="text-meta text-muted">
              {item.canceledQuantity > 0
                ? m.order_item_summary_with_canceled({
                    status:
                      item.flowState?.label ??
                      orderItemStatusLabel(item.status, item.fulfillmentSnapshot),
                    quantity: item.quantity,
                    canceled: item.canceledQuantity,
                    active: item.activeQuantity,
                  })
                : m.mypage_item_quantity({ quantity: item.quantity })}
            </p>
            {meta}
            <p className="tabular font-bold text-body">{formatPrice(item.totalPrice)}</p>
          </div>
        </div>
        {actions ? (
          <div className="grid grid-cols-2 gap-1.5 md:flex md:w-32 md:shrink-0 md:flex-col [&>*:last-child:nth-child(odd)]:col-span-2">
            {actions}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export const ACTION = buttonClass({ variant: "subtle", size: "sm", block: true });
export const ACTION_STRONG = buttonClass({ variant: "outline", size: "sm", block: true });

/** 목록 카드의 행동 — 누르면 주문 상세에서 해당 상품의 배송 조회·신청 폼이 열린다 */
function OrderItemLinks({ orderId, item }: { orderId: string; item: MyOrderItem }) {
  const links: ReactNode[] = [];
  if (canTrack(item)) {
    links.push(
      <Link
        key="track"
        to="/orders/$orderId"
        params={{ orderId }}
        search={{ track: item.orderItemId }}
        className={ACTION}
      >
        {m.mypage_action_tracking()}
      </Link>,
    );
  }
  if (canReview(item)) {
    links.push(
      <Link
        key="review"
        to="/account/reviews/write/$orderItemId"
        params={{ orderItemId: item.orderItemId }}
        className={ACTION_STRONG}
      >
        {m.order_review_write()}
      </Link>,
    );
  }
  if (canClaim(item)) {
    links.push(
      <Link
        key="claim"
        to="/orders/$orderId"
        params={{ orderId }}
        search={{ claim: item.orderItemId }}
        className={ACTION}
      >
        {m.order_claim_open()}
      </Link>,
    );
  }
  // 버튼이 세 개를 넘지 않게 한다 — 문의는 주문 상세에서도 열 수 있다
  if (links.length < 3)
    links.push(
      <Link
        key="inquiry"
        to="/account/support/new"
        search={{ orderItemId: item.orderItemId }}
        className={ACTION}
      >
        {m.mypage_action_inquiry()}
      </Link>,
    );
  return <>{links}</>;
}

/** 주문 카드 — 머리(주문일시·주문번호·주문 상세) + 상품 줄. 마이페이지 홈·주문 내역이 같이 쓴다 */
export function OrderCard({ order }: { order: MyOrder }) {
  return (
    <article className="min-w-0 border border-line">
      <header className="flex min-w-0 items-center justify-between gap-3 border-line border-b bg-chip px-4 py-3 text-meta md:px-5">
        <div className="flex min-w-0 flex-col gap-0.5 md:flex-row md:gap-3">
          <span className="font-bold">{formatDateTime(order.orderedAt)}</span>
          <span className="break-all text-muted">
            {m.order_number({ orderNo: orderNoText(order) })}
          </span>
        </div>
        <Link
          to="/orders/$orderId"
          params={{ orderId: order.orderId }}
          aria-label={`${m.mypage_order_detail()} ${orderNoText(order)}`}
          className="flex shrink-0 items-center gap-0.5 hover:underline"
        >
          {m.mypage_order_detail()}
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </Link>
      </header>
      <ul className="divide-y divide-line">
        {order.items.map((item) => (
          <li key={item.orderItemId}>
            <OrderItemRow
              item={item}
              actions={<OrderItemLinks orderId={order.orderId} item={item} />}
            />
          </li>
        ))}
      </ul>
    </article>
  );
}
