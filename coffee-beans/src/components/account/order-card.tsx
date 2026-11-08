import type { MyOrder } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { m } from "../../i18n";
import { formatDate, formatMoney, orderNumber } from "../../lib/format";
import { LineItem } from "../line-item";
import { StatusLabel } from "./status-label";

/** 주문 카드 — 주문일·번호·상태·상품 줄. 누르면 주문 상세 */
export function OrderCard({ order, link = true }: { order: MyOrder; link?: boolean }) {
  const no = orderNumber(order.orderNo);
  const head = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col">
        <span className="font-semibold text-body">{formatDate(order.orderedAt)}</span>
        {no ? (
          <span className="text-caption text-muted tabular">{m.order_number_short({ no })}</span>
        ) : null}
      </div>
      <div className="flex items-center gap-1">
        {order.progressStatus ? <StatusLabel status={order.progressStatus} /> : null}
        {link ? <ChevronRight className="size-4 text-muted" /> : null}
      </div>
    </div>
  );
  return (
    <article className="flex flex-col gap-3 rounded-card border border-line p-4">
      {link ? (
        <Link to="/orders/$orderId" params={{ orderId: order.orderId }} className="min-h-11">
          {head}
        </Link>
      ) : (
        head
      )}
      <ul className="flex flex-col gap-3">
        {order.items.map((item) => (
          <li key={item.orderItemId}>
            <LineItem
              name={item.productName}
              thumbnailUrl={item.thumbnailUrl}
              optionName={item.optionName}
              customInputs={item.customInputs}
              quantity={item.quantity}
              totalPrice={item.totalPrice}
              currency={order.currency}
            />
          </li>
        ))}
      </ul>
      <p className="flex justify-between border-line border-t pt-3 text-meta">
        <span className="text-muted">{m.order_paid_amount()}</span>
        <span className="font-bold tabular">
          {formatMoney(order.payment.totalAmount, order.currency)}
        </span>
      </p>
    </article>
  );
}
