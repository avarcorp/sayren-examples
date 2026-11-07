import { Link, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { m } from "../i18n";
import { parseCameraName } from "../lib/camera-name";
import { formatMoney } from "../lib/format";

/** 상품 줄 — 장바구니·주문서·주문 상세가 같이 쓴다. 사진이 없으면 작은 글자 커버 */
export function LineItem({
  name,
  thumbnailUrl,
  quantity,
  totalPrice,
  currency,
  muted = false,
  hidePrice = false,
  link,
  aside,
  children,
}: {
  link?: LinkProps;
  hidePrice?: boolean;
  name: string;
  thumbnailUrl: string | null;
  quantity: number;
  totalPrice: number;
  currency: string;
  muted?: boolean;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={`flex gap-4 py-4 ${muted ? "text-muted" : ""}`}>
      <div className="w-20 shrink-0">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="aspect-[4/5] w-full border border-line object-cover"
          />
        ) : (
          <div className="flex aspect-[4/5] w-full items-center justify-center border border-line p-1 text-center font-bold text-caption leading-tight">
            {parseCameraName(name).model}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          {link ? (
            <Link {...link} className="min-w-0 break-words text-body hover:underline">
              {name}
            </Link>
          ) : (
            <p className="min-w-0 break-words text-body">{name}</p>
          )}
          {aside}
        </div>
        {hidePrice ? null : (
          <>
            <p className="tabular text-meta text-sub">{m.cart_quantity({ count: quantity })}</p>
            <p className="tabular font-bold text-body-lg">{formatMoney(totalPrice, currency)}</p>
          </>
        )}
        {children}
      </div>
    </div>
  );
}
