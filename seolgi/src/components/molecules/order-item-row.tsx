import type { MyOrderItem } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { formatMoney } from "../../lib/format";
import { CLAIM_STATUS, ITEM_STATUS } from "../../lib/order-status";
import { ProductThumb } from "../atoms/product-thumb";
import { LineOptions } from "./line-options";

/** 주문 상품 한 줄 (시안 DOrder) — 88px 그림, 상태(굵게), 이름, 옵션·수량·금액, 오른쪽 버튼 */
export function OrderItemRow({ item, actions }: { item: MyOrderItem; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-5 border-line border-b py-6">
      <Link
        to="/products/$productNo"
        params={{ productNo: item.productId }}
        className="w-22 shrink-0"
        tabIndex={-1}
        aria-hidden
      >
        <ProductThumb src={item.thumbnailUrl} name={item.productName} size="sm" />
      </Link>
      <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1 text-body leading-normal">
        <span className="font-bold text-caption">
          {ITEM_STATUS[item.status] ?? item.status}
          {item.claimStatus ? (
            <span className="ml-2 font-normal text-primary">
              클레임 {CLAIM_STATUS[item.claimStatus] ?? item.claimStatus}
            </span>
          ) : null}
        </span>
        <span>{item.productName}</span>
        <LineOptions line={item} />
        <span className="text-caption text-muted">
          수량 {item.activeQuantity || item.quantity} · {formatMoney(item.totalPrice)}
        </span>
      </div>
      {actions ? <div className="flex flex-wrap gap-1.5">{actions}</div> : null}
    </div>
  );
}
