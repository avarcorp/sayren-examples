import type { ProductDetail, ProductFulfillmentView } from "@sayren/storefront-sdk";
import { Link, useHydrated, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { m } from "../i18n";
import { addToCart, prepareDirectCheckout } from "../lib/cart-actions";
import { formatPrice } from "../lib/format";
import { priceDisplayOf } from "../lib/price-display";
import {
  additionalPriceLabel,
  initialAddons,
  type OptionSelection,
  selectionPayload,
  selectionProblems,
  unitPriceOf,
} from "../lib/product-options";
import { useReceiveMethod } from "../lib/receive-method";
import type { DetailLayout } from "../site/layout-schema";
import { OrderingNotice, useOrdering } from "./ordering-notice";
import { optionFieldDomId, ProductOptionFields } from "./product-option-fields";
import { SubmitButton } from "./submit-button";

/**
 * 택배 없이 가게가 직접 넘기는 방식(직접 배달·방문 수령)만 받는 상품의 방식 — 택배가 섞여 있거나 방식이 없으면 null.
 * 이런 상품은 출고·도착 예정·도서산간 같은 택배 안내를 보이지 않는다
 */
export function localMethodsOf(fulfillment: ProductFulfillmentView): string[] | null {
  const methods = ("methods" in fulfillment ? fulfillment.methods : undefined) ?? [];
  const local = methods.filter((method) => method === "DIRECT" || method === "PICKUP");
  return local.length > 0 && local.length === methods.length ? local : null;
}

/** 이행 방식 이름 — 고른 순서(첫 값이 기본)대로 잇는다 */
export function methodsLabelOf(methods: readonly string[]): string {
  return methods
    .map((method) =>
      method === "DIRECT" ? m.fulfillment_method_direct() : m.fulfillment_method_pickup(),
    )
    .join(" · ");
}

/** 상품 상세의 받는 방법 한 줄 — 배송 상품은 배송비·예상 기간, 배송 없는 상품은 판매자가 직접 제공한다 */
export function deliveryNoteOf(fulfillment: ProductFulfillmentView): string {
  const local = localMethodsOf(fulfillment);
  if (local) return methodsLabelOf(local);
  switch (fulfillment.type) {
    case "SHIPPING": {
      const { deliveryType, deliveryFee, estimatedDays } = fulfillment.shipping;
      const fee =
        deliveryType === "FREE"
          ? m.product_purchase_free_delivery()
          : m.product_purchase_delivery_fee({ fee: formatPrice(deliveryFee) });
      return estimatedDays ? `${fee} · ${estimatedDays}` : fee;
    }
    case "MANUAL":
      return m.product_purchase_manual_delivery();
    default:
      return fulfillment.requiresShipping
        ? m.product_purchase_parcel_delivery()
        : m.product_purchase_no_delivery();
  }
}

type Variant = ProductDetail["variants"][number];

/** 기본 옵션(조합) 고르기 — select: 드롭다운 · chips: 버튼형 라디오. 품절 조합은 고를 수 없다 */
function VariantPicker({
  product,
  value,
  onChange,
  style,
}: {
  product: ProductDetail;
  value: string;
  onChange: (variantId: string) => void;
  style: DetailLayout["optionStyle"];
}) {
  const label = product.optionGroups.map((group) => group.name).join(" · ");
  const optionLabel = (option: Variant) => {
    const label = `${option.name}${additionalPriceLabel(option.additionalPrice, formatPrice)}`;
    return option.soldOut ? m.product_purchase_variant_sold_out({ label }) : label;
  };

  if (style === "chips") {
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm">{label}</legend>
        <div className="flex flex-wrap gap-2">
          {product.variants.map((option) => {
            const checked = option.variantId === value;
            return (
              <label
                key={option.variantId}
                className={`cursor-pointer rounded-control border px-3 py-2 text-sm has-[:focus-visible]:outline-2 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 ${
                  checked ? "border-brand bg-brand text-white" : "border-line"
                }`}
              >
                <input
                  type="radio"
                  name="optionId"
                  value={option.variantId}
                  checked={checked}
                  disabled={option.soldOut}
                  onChange={() => onChange(option.variantId)}
                  className="sr-only"
                />
                {optionLabel(option)}
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  return (
    <label className="block space-y-1">
      <span className="text-sm">{label}</span>
      <select
        name="optionId"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="h-11 w-full rounded-md border border-line px-3"
      >
        {product.variants.map((option) => (
          <option key={option.variantId} value={option.variantId} disabled={option.soldOut}>
            {optionLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * 구매 영역 — 이름·가격·받는 방법, 옵션, 수량, 장바구니·바로구매. 상품 상세와 홈의 상품 소개 섹션이 같은 컴포넌트를 쓴다.
 * 주문을 받지 않는 상점(`checkoutAvailable` false, 카탈로그형)은 담기·바로구매 대신 안내를 보인다.
 */
export function ProductPurchase({
  product,
  optionStyle = "select",
  heading = "h1",
  directExpired = false,
}: {
  product: ProductDetail;
  optionStyle?: DetailLayout["optionStyle"];
  /** 상세는 h1, 홈 섹션은 h2 */
  heading?: "h1" | "h2";
  /** 바로구매 주문서가 만료돼 돌아왔는가 */
  directExpired?: boolean;
}) {
  const navigate = useNavigate();
  const receiveMethod = useReceiveMethod();
  const hydrated = useHydrated();
  const ordering = useOrdering();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasOptions = product.optionGroups.length > 0;
  const { addonGroups, customInputs } = product;
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(
    product.variants.find((variant) => !variant.soldOut)?.variantId ?? "",
  );
  const [selection, setSelection] = useState<OptionSelection>(() => ({
    addons: initialAddons(addonGroups),
    inputs: {},
  }));
  /** 담기를 한 번 누른 뒤부터 칸마다 문제를 보인다 — 처음부터 빨간 글자로 맞지 않게 한다 */
  const [checked, setChecked] = useState(false);
  const problems = checked ? selectionProblems(addonGroups, customInputs, selection) : [];
  const variant = product.variants.find((v) => v.variantId === variantId);
  // 한 개 가격 = 판매가 + 조합 추가금 + 고른 추가 선택의 추가금. 최종 금액은 서버가 다시 계산한다
  const { price: basePrice, compareAt, rate } = priceDisplayOf(product);
  const price = unitPriceOf(
    basePrice,
    variant ? variant.additionalPrice : 0,
    addonGroups,
    selection,
  );
  const optionId = hasOptions ? variantId : undefined;
  const hasExtras = addonGroups.length > 0 || customInputs.length > 0;
  const Heading = heading;

  /** 담기 전 검사 — 문제가 있으면 첫 칸으로 포커스를 옮기고 요청 본문을 만들지 않는다 */
  const lineOrNull = () => {
    setChecked(true);
    const found = selectionProblems(addonGroups, customInputs, selection);
    if (found[0]) {
      document.getElementById(optionFieldDomId(found[0].key))?.focus();
      return null;
    }
    return {
      productId: product.productId,
      optionId,
      quantity,
      ...selectionPayload(addonGroups, customInputs, selection),
    };
  };

  return (
    <div id="buy-box" className="space-y-5">
      <div className="space-y-2">
        <Heading className="font-bold font-display text-2xl">{product.name}</Heading>
        {/* 정가(없으면 즉시할인 전 판매가) 취소선과 할인율 — 상품 한 개 기준이다(`lib/price-display.ts`) */}
        {compareAt !== null ? (
          <p className="flex items-baseline gap-2 text-sm">
            {rate ? (
              <span className="font-bold text-point">
                <span className="sr-only">{m.product_purchase_discount_rate()} </span>
                {rate}%
              </span>
            ) : null}
            <del className="text-muted">
              <span className="sr-only">{m.product_purchase_compare_price()} </span>
              {formatPrice(compareAt)}
            </del>
          </p>
        ) : null}
        <p className="font-bold text-xl">{formatPrice(price)}</p>
        <p className="text-muted text-sm">{deliveryNoteOf(product.fulfillment)}</p>
        {/* 구매 적립 예정액 — 서버가 상점·상품 적립률로 계산한 값이다. 구매 적립이 꺼져 있으면 null이라 그리지 않는다 */}
        {product.purchasePoint ? (
          <p className="text-muted text-sm">
            {m.product_purchase_point({ amount: formatPrice(product.purchasePoint) })}
          </p>
        ) : null}
      </div>

      {directExpired ? (
        <p role="status" className="rounded-md bg-chip p-3 text-sm">
          {m.product_purchase_direct_expired()}
        </p>
      ) : null}

      {/* 주문을 받지 않는 상점(결제 수단 없음·카탈로그형)은 담기·바로구매 대신 안내를 보인다 */}
      <OrderingNotice ordering={ordering} />

      {ordering.open ? (
        <>
          <form
            className="space-y-4"
            noValidate={hasExtras}
            onSubmit={(event) => {
              event.preventDefault();
              const line = lineOrNull();
              if (!line) return;
              setSubmitting(true);
              setError(null);
              addToCart({ data: line })
                .then(() => navigate({ to: "/cart" }))
                .catch(() => setError(m.product_purchase_add_failed()))
                .finally(() => setSubmitting(false));
            }}
          >
            {hasOptions ? (
              <VariantPicker
                product={product}
                value={variantId}
                onChange={setVariantId}
                style={optionStyle}
              />
            ) : null}

            <ProductOptionFields
              addonGroups={addonGroups}
              customInputs={customInputs}
              selection={selection}
              problems={problems}
              hydrated={hydrated}
              onChange={setSelection}
            />

            <label className="block space-y-1">
              <span className="text-sm">{m.product_purchase_quantity()}</span>
              <input
                type="number"
                name="quantity"
                min={1}
                max={999}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value) || 1)}
                className="h-11 w-24 rounded-md border border-line px-3"
              />
            </label>

            {problems.length ? (
              <p role="alert" className="text-point text-sm">
                {m.product_purchase_problems({ count: problems.length })}
              </p>
            ) : null}

            <SubmitButton
              disabled={submitting || product.soldOut}
              className="h-12 w-full rounded-md border border-ink font-semibold disabled:opacity-50"
            >
              {m.product_purchase_add_to_cart()}
            </SubmitButton>
          </form>

          {/* 바로구매는 주문서로 바로 간다 — 장바구니를 거치지 않는다 */}
          {product.soldOut ? (
            <span className="flex h-12 w-full items-center justify-center rounded-control bg-brand font-semibold text-white opacity-50">
              {m.product_purchase_buy_now()}
            </span>
          ) : hasExtras ? (
            /* 추가 선택·직접 입력이 있으면 담기와 같은 검사를 거친다. 직접 입력값은 URL에 싣지 않고
             서버 함수가 짧게 사는 HttpOnly 쿠키에 둔다(주문서가 새로고침돼도 같은 값으로 다시 만든다) */
            <button
              type="button"
              disabled={!hydrated || submitting}
              onClick={() => {
                const line = lineOrNull();
                if (!line) return;
                setSubmitting(true);
                setError(null);
                prepareDirectCheckout({ data: line })
                  .then((result) =>
                    result.search
                      ? navigate({
                          to: "/checkout",
                          search: { ...result.search, method: receiveMethod },
                        })
                      : setError(result.error),
                  )
                  .catch(() => setError(m.product_purchase_checkout_failed()))
                  .finally(() => setSubmitting(false));
              }}
              className="flex h-12 w-full items-center justify-center rounded-control bg-brand font-semibold text-white disabled:opacity-50"
            >
              {m.product_purchase_buy_now()}
            </button>
          ) : (
            <Link
              to="/checkout"
              search={{ productId: product.productId, optionId, quantity, method: receiveMethod }}
              className="flex h-12 w-full items-center justify-center rounded-control bg-brand font-semibold text-white"
            >
              {m.product_purchase_buy_now()}
            </Link>
          )}
          {error ? (
            <p role="alert" className="text-point text-sm">
              {error}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
