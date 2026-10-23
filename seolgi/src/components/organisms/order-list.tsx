import { formatOrderNo, type MyOrder } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { formatDate } from "../../lib/dates";
import { OrderItemRow } from "../molecules/order-item-row";

/** 주문 내역 — 주문마다 날짜·주문번호 머리와 상품 줄, 「주문 상세」 링크 */
export function OrderList({ orders }: { orders: MyOrder[] }) {
  if (orders.length === 0) {
    return (
      <p className="border-ink border-t py-24 text-center text-muted">
        아직 주문이 없습니다.{" "}
        <Link to="/products" className="text-ink underline underline-offset-4">
          상품 둘러보기
        </Link>
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-10">
      {orders.map((order) => (
        <section
          key={order.orderId}
          aria-label={`${formatDate(order.orderedAt)} 주문`}
          className="flex flex-col"
        >
          <div className="flex items-baseline justify-between border-ink border-b pb-3">
            <h2 className="font-medium text-section">{formatDate(order.orderedAt)}</h2>
            <Link
              to="/account/orders/$orderId"
              params={{ orderId: order.orderId }}
              className="flex items-center gap-0.5 py-1 text-small hover:underline"
            >
              <span className="text-muted">{formatOrderNo(order.orderNo) || order.orderId}</span>
              <span className="ml-2">주문 상세</span>
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
          {order.items.map((item) => (
            <OrderItemRow key={item.orderItemId} item={item} />
          ))}
        </section>
      ))}
    </div>
  );
}
