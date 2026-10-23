import type {
  AvailablePaymentOption,
  CartItem,
  CheckoutSession,
  MyCoupon,
  MyOrder,
  MyOrderItem,
} from "@sayren/storefront-sdk";
import { deliveryFeeOf, lineFromBody, lineView } from "./cart-routes";
import { fail, type MockRequest, newId, now, type Route } from "./http";
import { couponTargets, myCouponsOf, storeCoupons } from "./member-routes";
import { cartOwner, memberIdOf, persistent, state } from "./state";

/**
 * mock 주문서·결제. 결제 시작은 PG 결제창 없이 바로 주문을 만들고 `status: "completed"`로 답한다
 * (SDK `open()`이 창을 열지 않고 COMPLETED를 돌려준다). 금액 규칙은 운영과 같은 모양의 단순화다.
 */
export const PAYMENT_OPTIONS: AvailablePaymentOption[] = [
  { pg: "portone", method: "CARD", label: "신용·체크카드", pgName: "포트원" },
  {
    pg: "portone",
    method: "EASY_PAY",
    provider: "NAVERPAY",
    label: "네이버페이",
    pgName: "포트원",
  },
  {
    pg: "portone",
    method: "EASY_PAY",
    provider: "KAKAOPAY",
    label: "카카오페이",
    pgName: "포트원",
  },
  { pg: "portone", method: "EASY_PAY", provider: "TOSSPAY", label: "토스페이", pgName: "포트원" },
  { pg: "portone", method: "EASY_PAY", provider: "PAYCO", label: "페이코", pgName: "포트원" },
  { pg: "portone", method: "BANK_TRANSFER", label: "계좌이체", pgName: "포트원" },
  { pg: "portone", method: "VIRTUAL_ACCOUNT", label: "가상계좌", pgName: "포트원" },
  { pg: "portone", method: "MOBILE", label: "휴대폰 결제", pgName: "포트원" },
  // 같은 결제수단을 PG 여럿이 받는 상점(운영 설기로운과 같은 구성) — 주문서의 PG 고르기를 보인다
  { pg: "tosspayments", method: "CARD", label: "신용·체크카드", pgName: "토스페이먼츠" },
  { pg: "tosspayments", method: "BANK_TRANSFER", label: "계좌이체", pgName: "토스페이먼츠" },
  {
    pg: "kakaopay",
    method: "EASY_PAY",
    provider: "KAKAOPAY",
    label: "카카오페이",
    pgName: "카카오페이",
  },
  {
    pg: "naverpay",
    method: "EASY_PAY",
    provider: "NAVERPAY",
    label: "네이버페이",
    pgName: "네이버페이",
  },
];

/** 코드로 쓰는 쿠폰 — 누구나 입력할 수 있다 */
const CODE_COUPONS: Record<string, MyCoupon> = {
  SEOLGI3000: {
    issueId: "code_SEOLGI3000",
    couponId: "cpn_code3000",
    name: "설기로운 3,000원 코드 쿠폰",
    description: null,
    kind: "ORDER",
    benefit: { type: "AMOUNT", value: 3000, maxDiscountAmount: null },
    minOrderAmount: 15000,
    status: "AVAILABLE",
    validFrom: "2026-10-01T00:00:00.000Z",
    validUntil: null,
    usedOrderId: null,
    issuedAt: "2026-10-01T00:00:00.000Z",
  },
};

const POINT_BALANCE = 3500;
const POINT_UNIT = 10;
const POINT_MIN = 1000;

interface Session {
  checkoutId: string;
  ownerKey: string;
  memberId: string | null;
  cartItemIds: string[];
  items: CartItem[];
  expiresAt: string;
}

const sessions = persistent("sessions", () => new Map<string, Session>());
const payments = persistent(
  "payments",
  () => new Map<string, { orderId: string; status: string }>(),
);
const orderOwners = persistent(
  "orderOwners",
  () => new Map<string, { memberId: string | null; phone: string; password: string }>(),
);
export const ordersById = persistent("ordersById", () => new Map<string, MyOrder>());
const pointsUsed = persistent("pointsUsed", () => new Map<string, number>());

export function pointBalanceOf(memberId: string): number {
  return POINT_BALANCE - (pointsUsed.get(memberId) ?? 0);
}

function sessionOf(req: MockRequest): Session {
  const s = sessions.get(req.params[0] as string);
  if (!s) fail(404, "CHECKOUT_NOT_FOUND", "주문서를 찾을 수 없습니다");
  return s;
}

function baseAmounts(items: CartItem[]) {
  const productAmount = items.reduce((sum, i) => sum + i.totalPrice, 0);
  const deliveryFee = deliveryFeeOf(items);
  return { productAmount, deliveryFee };
}

function couponFor(
  memberId: string | null,
  ref: { issueId?: string; code?: string },
): MyCoupon | null {
  if (ref.code) return CODE_COUPONS[ref.code.toUpperCase()] ?? null;
  if (!ref.issueId || !memberId) return null;
  return (
    myCouponsOf(memberId).find((c) => c.issueId === ref.issueId && c.status === "AVAILABLE") ?? null
  );
}

/** 쿠폰 할인 — 대상 상품 금액 기준. 최소 주문 금액에 못 미치면 사유를 돌려준다 */
function discountOf(
  coupon: MyCoupon,
  items: CartItem[],
): { amount: number; reject: string | null } {
  const store = storeCoupons.find((c) => c.couponId === coupon.couponId);
  const eligible = items.filter((i) => !store || couponTargets(store, i.productId));
  const base = eligible.reduce((sum, i) => sum + i.totalPrice, 0);
  if (base === 0) return { amount: 0, reject: "NO_ELIGIBLE_ITEMS" };
  if (base < coupon.minOrderAmount) return { amount: 0, reject: "MIN_ORDER_AMOUNT" };
  const raw =
    coupon.benefit.type === "RATE"
      ? Math.floor((base * coupon.benefit.value) / 100)
      : coupon.benefit.value;
  return {
    amount: Math.min(raw, coupon.benefit.maxDiscountAmount ?? raw, base),
    reject: null,
  };
}

function price(
  s: Session,
  body: { coupons?: { issueId?: string; code?: string }[]; pointAmount?: number },
) {
  const { productAmount, deliveryFee } = baseAmounts(s.items);
  const ref = body.coupons?.[0];
  const coupon = ref ? couponFor(s.memberId, ref) : null;
  const applied = coupon ? discountOf(coupon, s.items) : null;
  if (ref && !coupon) fail(404, "COUPON_NOT_FOUND", "쿠폰을 찾을 수 없습니다");
  const couponDiscountAmount = applied?.amount ?? 0;
  const afterCoupon = productAmount + deliveryFee - couponDiscountAmount;
  const balance = s.memberId ? pointBalanceOf(s.memberId) : 0;
  const maxUsable = Math.max(0, Math.min(balance, afterCoupon));
  let pointAmount = 0;
  let pointReject: string | null = null;
  if (body.pointAmount) {
    if (!s.memberId) pointReject = "GUEST";
    else if (body.pointAmount < POINT_MIN) pointReject = "MIN_AMOUNT";
    else pointAmount = Math.floor(Math.min(body.pointAmount, maxUsable) / POINT_UNIT) * POINT_UNIT;
  }
  // 결제 금액이 1~99원 남으면 100원을 남긴다(운영 규칙)
  let adjust: string | null = null;
  const rest = afterCoupon - pointAmount;
  if (rest > 0 && rest < 100) {
    pointAmount = Math.max(0, afterCoupon - 100);
    adjust = "MIN_PAYMENT";
  }
  const totalAmount = afterCoupon - pointAmount;
  return {
    amounts: {
      productAmount,
      deliveryFee,
      couponDiscountAmount,
      deliveryDiscountAmount: 0,
      pointAmount,
      totalAmount,
    },
    coupons: coupon
      ? [
          {
            couponId: coupon.couponId,
            issueId: ref?.code ? null : coupon.issueId,
            code: ref?.code ? ref.code.toUpperCase() : null,
            name: coupon.name,
            kind: coupon.kind,
            benefit: coupon.benefit,
            applied: !applied?.reject,
            discountAmount: couponDiscountAmount,
            rejectReason: applied?.reject ?? null,
            optionId: null,
            lineId: null,
          },
        ]
      : [],
    items: s.items.map((i) => ({
      optionId: i.optionId,
      couponDiscountAmount: 0,
      pointAllocation: 0,
    })),
    points: s.memberId
      ? { balance, maxUsable, adjustReason: adjust, rejectReason: pointReject }
      : null,
    payable: true,
    paymentRequired: totalAmount > 0,
    coupon,
  };
}

const DELIVERY = {
  baseFee: 3000,
  remoteSurcharge: 0,
  remoteArea: "NONE" as const,
  remoteAreaLabel: null,
  bundleCount: 1,
  freeByThreshold: false,
  zipCode: null,
};

function sessionView(s: Session): CheckoutSession {
  const { productAmount, deliveryFee } = baseAmounts(s.items);
  const balance = s.memberId ? pointBalanceOf(s.memberId) : 0;
  return {
    checkoutId: s.checkoutId,
    currency: "KRW",
    items: s.items.map((i) => ({
      lineId: i.cartItemId,
      productId: i.productId,
      productName: i.productName,
      thumbnailUrl: i.thumbnailUrl,
      optionId: i.optionId,
      optionName: i.optionName,
      optionSelections: i.optionSelections,
      customInputs: i.customInputs,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
      fulfillment: i.fulfillment,
    })),
    amounts: {
      productAmount,
      deliveryFee,
      totalAmount: productAmount + deliveryFee,
      couponDiscountAmount: 0,
      deliveryDiscountAmount: 0,
      pointAmount: 0,
    },
    points: s.memberId
      ? {
          enabled: true,
          balance,
          maxUsable: Math.min(balance, productAmount + deliveryFee),
          unit: POINT_UNIT,
          minAmount: POINT_MIN,
          minBalance: 0,
        }
      : null,
    delivery: { ...DELIVERY, freeByThreshold: deliveryFee === 0 },
    requiresShipping: true,
    expiresAt: s.expiresAt,
    paymentOptions: PAYMENT_OPTIONS,
    testPayment: true,
  };
}

function orderNo(): string {
  const d = new Date(Date.now() + 9 * 3_600_000);
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${String(d.getUTCFullYear()).slice(2)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(Math.floor(Math.random() * 1e8), 8)}`;
}

/** 줄 → 주문 항목 */
export function orderItemOf(
  line: CartItem,
  no: string,
  index: number,
  status: MyOrderItem["status"],
): MyOrderItem {
  return {
    orderItemId: newId("oi"),
    orderItemNo: `${no}${String(index + 1).padStart(2, "0")}`,
    productId: line.productId,
    productName: line.productName,
    thumbnailUrl: line.thumbnailUrl,
    optionName: line.optionName,
    optionSelections: line.optionSelections,
    customInputs: line.customInputs,
    quantity: line.quantity,
    canceledQuantity: 0,
    activeQuantity: line.quantity,
    totalPrice: line.totalPrice,
    couponDiscountAmount: 0,
    pointAllocation: 0,
    status,
    fulfillmentSnapshot: { type: "SHIPPING", requiresShipping: true, method: "CARRIER" },
    fulfillment: null,
    claimStatus: null,
    reviewWritten: false,
    reviewWritable: status === "DELIVERED" || status === "PURCHASE_DECIDED",
    autoDecisionDate: null,
  };
}

export function registerOrder(
  order: MyOrder,
  owner: { memberId: string | null; phone: string; password: string },
) {
  ordersById.set(order.orderId, order);
  orderOwners.set(order.orderId, owner);
  if (owner.memberId)
    state.orders.set(owner.memberId, [order, ...(state.orders.get(owner.memberId) ?? [])]);
}

export function guestOrderMatches(
  orderRef: string,
  phone: string,
  password: string,
): MyOrder | null {
  const order = [...ordersById.values()].find(
    (o) => o.orderId === orderRef || o.orderNo === orderRef.replace(/-/g, ""),
  );
  if (!order) return null;
  const owner = orderOwners.get(order.orderId);
  if (
    !owner ||
    owner.memberId ||
    owner.phone !== phone.replace(/[^0-9+]/g, "") ||
    owner.password !== password
  )
    return null;
  return order;
}

export const checkoutRoutes: Route[] = [
  [
    "POST",
    /^\/checkout$/,
    (req) => {
      const body = req.body as {
        cartItemIds?: string[];
        directItem?: Parameters<typeof lineFromBody>[0];
      };
      const memberId = memberIdOf(req);
      let items: CartItem[];
      let ownerKey = "";
      if (body.cartItemIds) {
        const owner = cartOwner(req, false);
        ownerKey = owner.key;
        const lines = (state.carts.get(owner.key) ?? []).filter((l) =>
          body.cartItemIds?.includes(l.cartItemId),
        );
        items = lines.map(lineView).filter((i): i is CartItem => i?.purchasable === true);
        if (items.length === 0) fail(400, "CART_ITEM_NOT_FOUND", "주문할 상품이 없습니다");
      } else if (body.directItem) {
        const line = lineFromBody(body.directItem);
        items = [lineView({ ...line, cartItemId: newId("direct") }) as CartItem];
      } else {
        fail(400, "VALIDATION_FAILED", "주문할 상품이 없습니다");
      }
      const s: Session = {
        checkoutId: newId("chk"),
        ownerKey,
        memberId,
        cartItemIds: body.cartItemIds ?? [],
        items,
        expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      };
      sessions.set(s.checkoutId, s);
      return { status: 201, data: sessionView(s) };
    },
  ],
  [
    "POST",
    /^\/checkout\/([^/]+)\/delivery-quote$/,
    (req) => {
      const s = sessionOf(req);
      const zip = (req.body as { zipCode?: string }).zipCode ?? null;
      // 제주(63000~63644) 추가 배송비 3,000원
      const jeju = zip !== null && Number(zip) >= 63000 && Number(zip) <= 63644;
      const view = sessionView(s);
      const surcharge = jeju ? 3000 : 0;
      return {
        data: {
          amounts: {
            ...view.amounts,
            deliveryFee: view.amounts.deliveryFee + surcharge,
            totalAmount: view.amounts.totalAmount + surcharge,
          },
          delivery: {
            ...view.delivery,
            remoteSurcharge: surcharge,
            remoteArea: jeju ? "JEJU" : "NONE",
            remoteAreaLabel: jeju ? "제주" : null,
            zipCode: zip,
          },
        },
      };
    },
  ],
  [
    "POST",
    /^\/checkout\/([^/]+)\/pricing$/,
    (req) => {
      const { coupon: _c, ...pricing } = price(
        sessionOf(req),
        req.body as Parameters<typeof price>[1],
      );
      return { data: pricing };
    },
  ],
  [
    "GET",
    /^\/checkout\/([^/]+)\/coupons$/,
    (req) => {
      const s = sessionOf(req);
      if (!s.memberId) return { data: [] };
      return {
        data: myCouponsOf(s.memberId)
          .filter((c) => c.status === "AVAILABLE")
          .map((c) => {
            const { amount, reject } = discountOf(c, s.items);
            return {
              issueId: c.issueId,
              couponId: c.couponId,
              name: c.name,
              description: c.description,
              kind: c.kind,
              benefit: c.benefit,
              minOrderAmount: c.minOrderAmount,
              validUntil: c.validUntil,
              applicable: !reject,
              expectedDiscountAmount: amount,
              rejectReason: reject,
            };
          }),
      };
    },
  ],
  [
    "POST",
    /^\/checkout\/([^/]+)\/payment$/,
    (req) => {
      const s = sessionOf(req);
      const body = req.body as {
        option?: { method: string; provider?: string };
        shippingAddress?: MyOrder["shippingAddress"];
        guest?: { name: string; phone: string; email: string; orderPassword: string };
        coupons?: { issueId?: string; code?: string }[];
        pointAmount?: number;
      };
      if (!s.memberId && !body.guest) fail(400, "VALIDATION_FAILED", "주문자 정보가 필요합니다");
      const priced = price(s, body);
      const no = orderNo();
      const order: MyOrder = {
        orderId: newId("ord"),
        progressStatus: "PAID",
        orderNo: no,
        orderedAt: now(),
        items: s.items.map((line, i) => orderItemOf(line, no, i, "PAID")),
        requiresShipping: true,
        shippingAddress: body.shippingAddress ?? {
          receiverName: "",
          phone: "",
          zipCode: "",
          address1: "",
        },
        payment: {
          method: priced.amounts.totalAmount > 0 ? (body.option?.method ?? "CARD") : "POINT",
          easyPayProvider: body.option?.provider ?? null,
          couponDiscountAmount: priced.amounts.couponDiscountAmount,
          deliveryDiscountAmount: 0,
          pointAmount: priced.amounts.pointAmount,
          discounts: priced.coupon
            ? [
                {
                  couponId: priced.coupon.couponId,
                  name: priced.coupon.name,
                  kind: priced.coupon.kind,
                  discountAmount: priced.amounts.couponDiscountAmount,
                },
              ]
            : [],
          totalAmount: priced.amounts.totalAmount,
          paidAt: now(),
          receiptUrl: null,
          refundedAmount: 0,
          refundPendingAmount: 0,
          pointRefundedAmount: 0,
        },
        currency: "KRW",
        testPayment: true,
      };
      registerOrder(order, {
        memberId: s.memberId,
        phone: (body.guest?.phone ?? body.shippingAddress?.phone ?? "").replace(/[^0-9+]/g, ""),
        password: body.guest?.orderPassword ?? "",
      });
      // 결제가 끝나면 장바구니에서 산 줄을 빼고, 쿠폰·적립금을 쓴 것으로 둔다
      if (s.cartItemIds.length) {
        state.carts.set(
          s.ownerKey,
          (state.carts.get(s.ownerKey) ?? []).filter((l) => !s.cartItemIds.includes(l.cartItemId)),
        );
      }
      if (priced.coupon && s.memberId && !body.coupons?.[0]?.code) {
        priced.coupon.status = "USED";
        priced.coupon.usedOrderId = order.orderId;
      }
      if (s.memberId && priced.amounts.pointAmount)
        pointsUsed.set(s.memberId, (pointsUsed.get(s.memberId) ?? 0) + priced.amounts.pointAmount);
      sessions.delete(s.checkoutId);
      const paymentId = newId("pay");
      payments.set(paymentId, { orderId: order.orderId, status: "completed" });
      return {
        data: {
          paymentId,
          status: "completed",
          orderId: order.orderId,
          attemptId: null,
          option: null,
          payUrl: null,
          launch: null,
          expiresAt: s.expiresAt,
          testPayment: true,
          amounts: priced.amounts,
          delivery: DELIVERY,
        },
      };
    },
  ],
  [
    "GET",
    /^\/payments\/([^/]+)$/,
    (req) => {
      const p = payments.get(req.params[0] as string);
      if (!p) fail(404, "PAYMENT_NOT_FOUND", "결제를 찾을 수 없습니다");
      return {
        data: {
          paymentId: req.params[0],
          status: p.status,
          result: "COMPLETED",
          orderId: p.orderId,
          lastFailure: null,
          testPayment: true,
          expiresAt: now(),
        },
      };
    },
  ],
  [
    "POST",
    /^\/guest\/orders\/([^/]+)$/,
    (req) => {
      const body = req.body as { phone: string; orderPassword: string };
      const order = guestOrderMatches(req.params[0] as string, body.phone, body.orderPassword);
      if (!order) fail(404, "ORDER_NOT_FOUND", "주문 정보가 맞지 않습니다");
      return { data: order };
    },
  ],
];
