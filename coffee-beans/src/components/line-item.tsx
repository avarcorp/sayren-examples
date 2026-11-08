import type { CustomInputValueView } from "@sayren/storefront-sdk";
import type { ReactNode } from "react";
import { m } from "../i18n";
import { formatMoney } from "../lib/format";
import { ProductImage } from "./product-image";

/** 상품 줄 — 썸네일·이름·옵션(용량)·직접 입력(분쇄도)·수량·금액(서버 값) */
export function LineItem({
  name,
  thumbnailUrl,
  optionName,
  customInputs,
  quantity,
  totalPrice,
  currency,
  children,
  aside,
}: {
  name: string;
  thumbnailUrl: string | null | undefined;
  optionName: string | null;
  customInputs?: CustomInputValueView[];
  quantity: number;
  totalPrice: number;
  currency?: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <ProductImage src={thumbnailUrl ?? null} alt={name} className="w-20 shrink-0 self-start" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 break-words text-body leading-snug">{name}</p>
          {aside}
        </div>
        {optionName ? <p className="text-caption text-muted">{optionName}</p> : null}
        {customInputs?.map((input) => (
          <p key={`${input.label}-${input.value}`} className="break-words text-caption text-muted">
            {input.label}: {input.value}
          </p>
        ))}
        <p className="flex flex-wrap items-baseline gap-x-2 text-meta">
          <span className="text-muted">{m.line_quantity({ count: quantity })}</span>
          <span className="font-bold text-body tabular">{formatMoney(totalPrice, currency)}</span>
        </p>
        {children}
      </div>
    </div>
  );
}
