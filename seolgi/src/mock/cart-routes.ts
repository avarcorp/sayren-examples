import type { Cart, CartItem } from "@sayren/storefront-sdk";
import { findProduct } from "./catalog-routes";
import { fail, newId, type Route } from "./http";
import { type CartLine, cartOwner, state } from "./state";

const DELIVERY_FEE = 3000;
const FREE_FROM = 30000;

/** 줄 하나의 응답 모양 — 가격은 상품 가격 + 조합 추가금 + 추가 선택 추가금 */
export function lineView(line: CartLine): CartItem | null {
  const product = findProduct(line.productId);
  if (!product) return null;
  const d = product.detail;
  const variant = d.variants.find((v) => v.variantId === line.optionId) ?? null;
  const optionSelections = [
    ...(variant?.valueIds.length
      ? d.optionGroups.map((g) => {
          const value = g.values.find((v) => variant.valueIds.includes(v.valueId));
          return {
            kind: "combination",
            groupName: g.name,
            valueName: value?.name ?? "",
            additionalPrice: 0,
          };
        })
      : []),
    ...line.addons.flatMap((a) => {
      const group = d.addonGroups.find((g) => g.groupId === a.groupId);
      const value = group?.values.find((v) => v.valueId === a.valueId);
      return group && value
        ? [
            {
              kind: "addon",
              groupName: group.name,
              valueName: value.name,
              additionalPrice: value.additionalPrice,
            },
          ]
        : [];
    }),
  ];
  const customInputs = line.customInputs.flatMap((c) => {
    const input = d.customInputs.find((i) => i.inputId === c.inputId);
    return input
      ? [{ label: input.label, value: c.value, key: input.key ?? null, type: input.type ?? "text" }]
      : [];
  });
  const unitPrice =
    (d.discountedPrice ?? d.salePrice) +
    (variant?.additionalPrice ?? 0) +
    optionSelections.reduce((s, o) => s + o.additionalPrice, 0);
  const soldOut = d.soldOut || Boolean(variant?.soldOut);
  return {
    cartItemId: line.cartItemId,
    productId: d.productId,
    productNo: d.productNo,
    productName: d.name,
    thumbnailUrl: d.thumbnailUrl,
    optionId: line.optionId,
    optionName: variant?.name || null,
    optionSelections,
    customInputs,
    quantity: line.quantity,
    unitPrice,
    totalPrice: unitPrice * line.quantity,
    fulfillment: { type: "SHIPPING", requiresShipping: true, method: "CARRIER" },
    purchasable: !soldOut,
    unpurchasableReason: soldOut ? "SOLD_OUT" : null,
    currency: "KRW",
    availableInMarket: true,
  };
}

/** 배송비 — 3,000원, 상품 금액 30,000원 이상이거나 무료배송 상품만이면 0원 */
export function deliveryFeeOf(items: CartItem[]): number {
  if (items.length === 0) return 0;
  const amount = items.reduce((s, i) => s + i.totalPrice, 0);
  const allFree = items.every((i) => findProduct(i.productId)?.card.freeShipping);
  return amount >= FREE_FROM || allFree ? 0 : DELIVERY_FEE;
}

export function cartView(lines: CartLine[]): Cart {
  const items = lines.map(lineView).filter((i): i is CartItem => i !== null);
  const buyable = items.filter((i) => i.purchasable);
  const productAmount = buyable.reduce((s, i) => s + i.totalPrice, 0);
  const deliveryFee = deliveryFeeOf(buyable);
  return {
    items,
    summary: {
      currency: "KRW",
      productAmount,
      deliveryFee,
      totalAmount: productAmount + deliveryFee,
      requiresShipping: items.length > 0,
    },
  };
}

function respond(key: string, issued?: string) {
  return {
    data: cartView(state.carts.get(key) ?? []),
    headers: issued ? { "x-cart-token": issued } : undefined,
  };
}

interface LineBody {
  productId: string;
  optionId?: string;
  quantity: number;
  addons?: CartLine["addons"];
  customInputs?: CartLine["customInputs"];
}

/** 담기 요청 검사 — 운영과 같은 오류 코드로 막는다 */
export function lineFromBody(body: LineBody): Omit<CartLine, "cartItemId"> {
  const product = findProduct(body.productId);
  if (!product) fail(404, "PRODUCT_NOT_FOUND", "상품을 찾을 수 없습니다");
  const d = product.detail;
  const optionId =
    body.optionId ?? (d.optionGroups.length === 0 ? (d.variants[0]?.variantId ?? null) : null);
  if (d.optionGroups.length > 0 && !d.variants.some((v) => v.variantId === optionId))
    fail(400, "OPTION_REQUIRED", "옵션을 선택하십시오");
  const variant = d.variants.find((v) => v.variantId === optionId);
  if (d.soldOut || variant?.soldOut) fail(409, "OUT_OF_STOCK", "품절된 상품입니다");
  for (const input of d.customInputs) {
    const value = body.customInputs?.find((c) => c.inputId === input.inputId)?.value ?? "";
    if (input.required && !value.trim())
      fail(400, "CUSTOM_INPUT_REQUIRED", `${input.label}을(를) 입력하십시오`);
  }
  return {
    productId: d.productId,
    optionId: optionId ?? null,
    quantity: body.quantity,
    addons: body.addons ?? [],
    customInputs: body.customInputs ?? [],
  };
}

export const cartRoutes: Route[] = [
  [
    "GET",
    /^\/cart$/,
    (req) => {
      const { key, issued } = cartOwner(req, true);
      return respond(key, issued);
    },
  ],
  [
    "POST",
    /^\/cart\/items$/,
    (req) => {
      const { key, issued } = cartOwner(req, true);
      const line = lineFromBody(req.body as LineBody);
      const lines = state.carts.get(key) ?? [];
      const same = lines.find(
        (l) =>
          l.productId === line.productId &&
          l.optionId === line.optionId &&
          JSON.stringify(l.addons) === JSON.stringify(line.addons) &&
          JSON.stringify(l.customInputs) === JSON.stringify(line.customInputs),
      );
      if (same) same.quantity = Math.min(999, same.quantity + line.quantity);
      else lines.push({ ...line, cartItemId: newId("ci") });
      state.carts.set(key, lines);
      return respond(key, issued);
    },
  ],
  [
    "PATCH",
    /^\/cart\/items\/([^/]+)$/,
    (req) => {
      const { key } = cartOwner(req, false);
      const line = state.carts.get(key)?.find((l) => l.cartItemId === req.params[0]);
      if (!line) fail(404, "CART_ITEM_NOT_FOUND", "장바구니 항목을 찾을 수 없습니다");
      const body = req.body as Partial<LineBody>;
      if (body.quantity) line.quantity = body.quantity;
      if (body.optionId) line.optionId = body.optionId;
      if (body.addons) line.addons = body.addons;
      if (body.customInputs) line.customInputs = body.customInputs;
      return respond(key);
    },
  ],
  [
    "DELETE",
    /^\/cart\/items\/([^/]+)$/,
    (req) => {
      const { key } = cartOwner(req, false);
      const lines = state.carts.get(key) ?? [];
      if (!lines.some((l) => l.cartItemId === req.params[0]))
        fail(404, "CART_ITEM_NOT_FOUND", "장바구니 항목을 찾을 수 없습니다");
      state.carts.set(
        key,
        lines.filter((l) => l.cartItemId !== req.params[0]),
      );
      return {};
    },
  ],
  [
    "POST",
    /^\/uploads\/order-inputs$/,
    (req) => ({
      // 올린 파일은 버리고 정해 둔 그림 주소를 돌려준다
      data: {
        url: `${req.origin}/mock/review-dog-1.svg`,
        uploadUrl: `${req.origin}/mock-api/upload`,
      },
    }),
  ],
];
