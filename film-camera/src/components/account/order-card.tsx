import { formatOrderNo, type MyOrder } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { m } from "../../i18n";
import { LineItem } from "../line-item";
import { DateText } from "../ui";
import { StatusLabel } from "./status-label";

/** 주문 카드 — 번호·날짜·상품 줄·단계. 주문 내역과 비회원 조회가 같이 쓴다 */
export function OrderCard({
  order,
  linkToDetail = true,
}: {
  order: MyOrder;
  linkToDetail?: boolean;
}) {
  return (
    <article className="flex flex-col border-ink border-t">
      <header className="flex flex-wrap items-center justify-between gap-2 py-3">
        <div className="flex flex-col">
          <span className="text-meta text-sub">
            <DateText iso={order.orderedAt} />
          </span>
          <span className="tabular font-semibold text-body">
            {m.order_no({ no: formatOrderNo(order.orderNo ?? order.orderId) })}
          </span>
        </div>
        {linkToDetail ? (
          <Link
            to="/orders/$orderId"
            params={{ orderId: order.orderId }}
            className="inline-flex min-h-11 items-center text-body text-point-strong underline"
          >
            {m.order_detail_link()}
          </Link>
        ) : null}
      </header>
      <ul className="divide-y divide-line border-line border-y">
        {order.items.map((item) => (
          <li key={item.orderItemId}>
            <LineItem
              name={item.productName}
              thumbnailUrl={item.thumbnailUrl}
              quantity={item.quantity}
              totalPrice={item.totalPrice}
              currency={order.currency ?? "KRW"}
              aside={<StatusLabel item={item} />}
            />
          </li>
        ))}
      </ul>
    </article>
  );
}
