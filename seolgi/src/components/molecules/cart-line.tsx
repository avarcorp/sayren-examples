import type { CartItem } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { formatMoney } from "../../lib/format";
import { MAX_LINE_QUANTITY } from "../../lib/line-request";
import { productPathParam } from "../../lib/product-path";
import { ProductThumb } from "../atoms/product-thumb";
import { QuantityStepper } from "../atoms/quantity-stepper";
import { LineOptions } from "./line-options";

const REASON: Record<string, string> = {
  SOLD_OUT: "품절",
  SUSPENDED: "판매 중지",
  CLOSED: "판매 종료",
};

/** 장바구니 한 줄 (시안 DCart) — 선택, 그림, 이름·옵션·입력, 수량·옵션 변경, 금액·삭제 */
export function CartLine({
  item,
  picked,
  busy,
  onPick,
  onQuantity,
  onRemove,
}: {
  item: CartItem;
  picked: boolean;
  busy: boolean;
  onPick: () => void;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const productPath = productPathParam(item);
  return (
    <li className="flex gap-4 border-line border-b py-6 md:gap-5">
      <input
        type="checkbox"
        aria-label={`${item.productName} 선택`}
        className="mt-1 size-[18px] shrink-0 accent-primary"
        disabled={!item.purchasable}
        checked={picked}
        onChange={onPick}
      />
      <Link
        to="/products/$productNo"
        params={{ productNo: productPath }}
        className="w-20 shrink-0 md:w-28"
        tabIndex={-1}
        aria-hidden
      >
        <ProductThumb src={item.thumbnailUrl} name={item.productName} size="sm" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-body">
        <Link
          to="/products/$productNo"
          params={{ productNo: productPath }}
          className="hover:underline"
        >
          {item.productName}
        </Link>
        <LineOptions line={item} />
        {!item.purchasable ? (
          <span className="font-medium text-primary text-small">
            {REASON[item.unpurchasableReason ?? ""] ?? "구매할 수 없음"}
          </span>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-5">
          <QuantityStepper
            size="sm"
            value={item.quantity}
            max={MAX_LINE_QUANTITY}
            disabled={busy}
            onChange={onQuantity}
          />
          <Link
            to="/products/$productNo"
            params={{ productNo: productPath }}
            className="py-2 text-small underline underline-offset-[3px]"
          >
            옵션 변경
          </Link>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <strong className="font-bold text-base">
          {formatMoney(item.totalPrice, item.currency)}
        </strong>
        <button
          type="button"
          aria-label={`${item.productName} 삭제`}
          disabled={busy}
          className="grid size-9 place-items-center"
          onClick={onRemove}
        >
          <X className="size-3.5 text-muted" aria-hidden />
        </button>
      </div>
    </li>
  );
}
