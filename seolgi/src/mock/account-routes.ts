import type {
  CartItem,
  CustomerInquiry,
  MemberAddress,
  MyClaim,
  MyOrder,
  MyReview,
} from "@sayren/storefront-sdk";
import { lineView } from "./cart-routes";
import { mockProducts } from "./catalog";
import { orderItemOf, pointBalanceOf, registerOrder } from "./checkout-routes";
import { fail, newId, now, pageOf, type Route } from "./http";
import { DEMO_MEMBER, persistent, requireMember, state } from "./state";

/**
 * mock 마이페이지 — 주문·배송 조회·구매확정·취소/반품·리뷰·문의·적립금·배송지.
 * 데모 회원(seolgi@example.com)에게는 지난 주문 몇 건을 미리 넣어 둔다.
 */
const addresses = state.addresses;
const seedAddresses = () =>
  addresses.set(DEMO_MEMBER.memberId, [
    {
      addressId: "addr_mock_home",
      alias: "집",
      isDefault: true,
      receiverName: "김설기",
      phone: "01012345678",
      zipCode: "04001",
      address1: "서울특별시 마포구 와우산로 94 (서교동)",
      address2: "301호",
      countryCode: "KR",
      city: null,
      region: null,
    },
    {
      addressId: "addr_mock_office",
      alias: "회사",
      isDefault: false,
      receiverName: "김설기",
      phone: "01012345678",
      zipCode: "06236",
      address1: "서울특별시 강남구 테헤란로 152",
      address2: "12층",
      countryCode: "KR",
      city: null,
      region: null,
    },
  ]);

const claims = persistent("claims", () => new Map<string, MyClaim[]>());
const reviews = persistent("reviews", () => new Map<string, MyReview[]>());
const customerInquiries = persistent(
  "customerInquiries",
  () => new Map<string, CustomerInquiry[]>(),
);

function lineOf(productNo: number, quantity = 1): CartItem {
  const p = mockProducts.find((x) => x.card.productNo === productNo);
  const variant = p?.detail.variants.find((v) => v.valueIds.length > 0) ?? p?.detail.variants[0];
  return lineView({
    cartItemId: "seed",
    productId: p?.card.productId ?? "",
    optionId: variant?.variantId ?? null,
    quantity,
    addons: [],
    customInputs: [],
  }) as CartItem;
}

/** 데모 회원의 지난 주문 — 배송 중·배송 완료·구매확정 */
function seedOrders() {
  const seeds: { days: number; lines: CartItem[]; status: MyOrder["items"][number]["status"] }[] = [
    { days: 2, lines: [lineOf(4), lineOf(7, 2)], status: "DELIVERING" },
    { days: 9, lines: [lineOf(1), lineOf(3)], status: "DELIVERED" },
    { days: 30, lines: [lineOf(6)], status: "PURCHASE_DECIDED" },
  ];
  for (const seed of seeds) {
    const at = new Date(Date.now() - seed.days * 86_400_000).toISOString();
    const no = `2610${String(seed.days).padStart(2, "0")}${String(10000000 + seed.days * 7919).slice(0, 8)}`;
    const productAmount = seed.lines.reduce((s, l) => s + l.totalPrice, 0);
    const deliveryFee = productAmount >= 30000 ? 0 : 3000;
    const order: MyOrder = {
      orderId: `ord_mock_seed_${seed.days}`,
      progressStatus: seed.status,
      orderNo: no,
      orderedAt: at,
      items: seed.lines.map((l, i) => ({
        ...orderItemOf(l, no, i, seed.status),
        orderItemId: `oi_mock_${seed.days}_${i}`,
        reviewWritten: seed.status === "PURCHASE_DECIDED",
        reviewWritable: seed.status === "DELIVERED",
        autoDecisionDate:
          seed.status === "DELIVERED" ? new Date(Date.now() + 5 * 86_400_000).toISOString() : null,
        fulfillment:
          seed.status === "DELIVERING" ||
          seed.status === "DELIVERED" ||
          seed.status === "PURCHASE_DECIDED"
            ? { status: "DISPATCHED", fulfilledAt: at, note: null }
            : null,
      })),
      requiresShipping: true,
      shippingAddress: {
        receiverName: "김설기",
        phone: "01012345678",
        zipCode: "04001",
        address1: "서울특별시 마포구 와우산로 94 (서교동)",
        address2: "301호",
        deliveryMemo: "문 앞에 놓아 주십시오",
      },
      payment: {
        method: seed.days === 9 ? "EASY_PAY" : "CARD",
        easyPayProvider: seed.days === 9 ? "NAVERPAY" : null,
        couponDiscountAmount: 0,
        deliveryDiscountAmount: 0,
        pointAmount: 0,
        discounts: [],
        totalAmount: productAmount + deliveryFee,
        paidAt: at,
        receiptUrl: null,
        refundedAmount: 0,
        refundPendingAmount: 0,
        pointRefundedAmount: 0,
      },
      currency: "KRW",
      testPayment: true,
    };
    registerOrder(order, { memberId: DEMO_MEMBER.memberId, phone: "01012345678", password: "" });
  }
  // 리뷰는 구매확정 주문의 상품에 하나 써 둔다
  const decided = state.orders
    .get(DEMO_MEMBER.memberId)
    ?.find((o) => o.progressStatus === "PURCHASE_DECIDED");
  const item = decided?.items[0];
  if (item) {
    reviews.set(DEMO_MEMBER.memberId, [
      {
        reviewId: "rev_mock_mine",
        productId: item.productId,
        productName: item.productName,
        thumbnailUrl: item.thumbnailUrl,
        optionName: item.optionName,
        rating: 5,
        content: "몸을 말고 자는 우리 아이한테 딱 맞아요. 커버 세탁도 편합니다.",
        images: ["/mock/review-dog-3.svg"],
        sellerReply: null,
        blinded: false,
        editable: false,
        editableUntil: decided.orderedAt,
        createdAt: decided.orderedAt,
      },
    ]);
  }
}
// 데모 주문·배송지는 처음 한 번만 넣는다(HMR로 다시 읽어도 겹치지 않게)
if (!state.seeded) {
  state.seeded = true;
  seedAddresses();
  seedOrders();
}

/** 회원 주문 — 최근 주문이 먼저 */
function myOrders(memberId: string): MyOrder[] {
  return [...(state.orders.get(memberId) ?? [])].sort(
    (a, b) => Date.parse(b.orderedAt) - Date.parse(a.orderedAt),
  );
}

function findItem(memberId: string, orderItemId: string) {
  for (const order of myOrders(memberId)) {
    const item = order.items.find((i) => i.orderItemId === orderItemId);
    if (item) return { order, item };
  }
  fail(404, "ORDER_ITEM_NOT_FOUND", "주문 상품을 찾을 수 없습니다");
}

/** 주문 전체 진행 상태 — 항목 중 가장 앞선 단계 */
function refreshProgress(order: MyOrder) {
  const rank = [
    "PAYMENT_WAITING",
    "PAID",
    "CONFIRMED",
    "DISPATCHED",
    "DELIVERING",
    "DELIVERED",
    "PURCHASE_DECIDED",
    "CANCELED",
  ];
  const live = order.items.filter((i) => i.status !== "CANCELED");
  order.progressStatus = live.length
    ? (live.map((i) => i.status).sort((a, b) => rank.indexOf(a) - rank.indexOf(b))[0] ?? "PAID")
    : "CANCELED";
}

export const accountRoutes: Route[] = [
  [
    "GET",
    /^\/me\/orders$/,
    (req) => {
      const m = requireMember(req);
      return { data: pageOf(myOrders(m.memberId), req.query, 10) };
    },
  ],
  [
    "GET",
    /^\/me\/orders\/([^/]+)$/,
    (req) => {
      const m = requireMember(req);
      const order = myOrders(m.memberId).find((o) => o.orderId === req.params[0]);
      if (!order) fail(404, "ORDER_NOT_FOUND", "주문을 찾을 수 없습니다");
      return { data: order };
    },
  ],
  [
    "GET",
    /^\/me\/order-items\/([^/]+)\/delivery$/,
    (req) => {
      const m = requireMember(req);
      const { order, item } = findItem(m.memberId, req.params[0] as string);
      const delivered = item.status === "DELIVERED" || item.status === "PURCHASE_DECIDED";
      const at = (h: number) =>
        new Date(new Date(order.orderedAt).getTime() + h * 3_600_000).toISOString();
      return {
        data: {
          carrierName: "CJ대한통운",
          trackingNumber: "6894 1234 5678",
          trackingUrl: "https://trace.cjlogistics.com/",
          status: delivered ? "DELIVERED" : "DELIVERING",
          trackingEvents: [
            { status: "집화 처리", location: "서울 마포", occurredAt: at(20), stage: "PICKED_UP" },
            {
              status: "간선 상차",
              location: "곤지암 허브",
              occurredAt: at(30),
              stage: "IN_TRANSIT",
            },
            {
              status: "배송 출발",
              location: "서울 서교",
              occurredAt: at(40),
              stage: "OUT_FOR_DELIVERY",
            },
            ...(delivered
              ? [
                  {
                    status: "배송 완료",
                    location: "서울 서교",
                    occurredAt: at(46),
                    stage: "DELIVERED",
                  },
                ]
              : []),
          ].reverse(),
          trackingStage: delivered ? "DELIVERED" : "OUT_FOR_DELIVERY",
          trackingCheckedAt: now(),
        },
      };
    },
  ],
  [
    "POST",
    /^\/me\/order-items\/([^/]+)\/purchase-decision$/,
    (req) => {
      const m = requireMember(req);
      const { order, item } = findItem(m.memberId, req.params[0] as string);
      if (item.status !== "DELIVERED")
        fail(409, "INVALID_STATUS", "배송 완료된 상품만 구매확정합니다");
      item.status = "PURCHASE_DECIDED";
      item.reviewWritable = !item.reviewWritten;
      refreshProgress(order);
      return {};
    },
  ],
  [
    "POST",
    /^\/me\/order-items\/([^/]+)\/claims\/preview$/,
    (req) => {
      const m = requireMember(req);
      const { item } = findItem(m.memberId, req.params[0] as string);
      const body = req.body as { type: string; reason: string };
      const fee =
        body.type === "CANCEL" || ["DEFECTIVE", "WRONG_DELIVERY"].includes(body.reason) ? 0 : 3000;
      return {
        data: {
          approved: false,
          expectedRefundAmount: body.type === "EXCHANGE" ? 0 : item.totalPrice - fee,
          claimDeliveryFee: body.type === "EXCHANGE" ? fee * 2 : fee,
          quantity: item.activeQuantity,
          deliveryFeeRefundAmount: 0,
          couponChargeAmount: 0,
          couponChargeRefundAmount: 0,
          pointRefundAmount: 0,
          deductAmount: fee,
        },
      };
    },
  ],
  [
    "POST",
    /^\/me\/order-items\/([^/]+)\/claims$/,
    (req) => {
      const m = requireMember(req);
      const { order, item } = findItem(m.memberId, req.params[0] as string);
      const body = req.body as { type: "CANCEL" | "RETURN" | "EXCHANGE"; reason: string };
      if (item.claimStatus) fail(409, "CLAIM_ALREADY_EXISTS", "이미 신청한 상품입니다");
      const cancel = body.type === "CANCEL";
      const claim: MyClaim = {
        claimId: newId("clm"),
        claimNo: `C${order.orderNo?.slice(0, 6) ?? "261022"}${String(Date.now()).slice(-8)}`,
        type: body.type,
        status: cancel ? "COMPLETED" : "REQUESTED",
        orderItemId: item.orderItemId,
        productName: item.productName,
        quantity: item.activeQuantity,
        reason: body.reason,
        expectedRefundAmount: body.type === "EXCHANGE" ? 0 : item.totalPrice,
        expectedDeliveryFeeRefundAmount: 0,
        expectedPointRefundAmount: 0,
        rejectReason: null,
        returnAddress: cancel
          ? null
          : {
              name: "설기로운 물류센터",
              contactName: "반품 담당",
              phone: "15880000",
              zipCode: "10881",
              address1: "경기도 파주시 회동길 00",
              address2: "설기로운 반품팀",
            },
        requestedAt: now(),
        completedAt: cancel ? now() : null,
      };
      claims.set(m.memberId, [claim, ...(claims.get(m.memberId) ?? [])]);
      item.claimStatus = claim.status;
      if (cancel) {
        item.status = "CANCELED";
        item.canceledQuantity = item.quantity;
        item.activeQuantity = 0;
        order.payment.refundedAmount += item.totalPrice;
      }
      refreshProgress(order);
      return {
        status: 201,
        data: {
          claimId: claim.claimId,
          claimNo: claim.claimNo,
          status: "REQUESTED",
          approved: cancel,
          expectedRefundAmount: claim.expectedRefundAmount,
          claimDeliveryFee: 0,
          quantity: claim.quantity,
          deliveryFeeRefundAmount: 0,
          couponChargeAmount: 0,
          couponChargeRefundAmount: 0,
          pointRefundAmount: 0,
        },
      };
    },
  ],
  [
    "GET",
    /^\/me\/claims$/,
    (req) => {
      const m = requireMember(req);
      return { data: pageOf(claims.get(m.memberId) ?? [], req.query) };
    },
  ],
  [
    "POST",
    /^\/me\/claims\/([^/]+)\/withdraw$/,
    (req) => {
      const m = requireMember(req);
      const claim = (claims.get(m.memberId) ?? []).find((c) => c.claimId === req.params[0]);
      if (claim?.status !== "REQUESTED")
        fail(409, "CLAIM_NOT_WITHDRAWABLE", "철회할 수 없는 신청입니다");
      claim.status = "WITHDRAWN";
      for (const order of myOrders(m.memberId))
        for (const i of order.items) if (i.orderItemId === claim.orderItemId) i.claimStatus = null;
      return {};
    },
  ],
  [
    "GET",
    /^\/me\/reviews$/,
    (req) => {
      const m = requireMember(req);
      return { data: pageOf(reviews.get(m.memberId) ?? [], req.query) };
    },
  ],
  [
    "GET",
    /^\/me\/reviews\/writable$/,
    (req) => {
      const m = requireMember(req);
      const list = myOrders(m.memberId).flatMap((o) =>
        o.items
          .filter((i) => i.reviewWritable && !i.reviewWritten)
          .map((i) => ({
            orderItemId: i.orderItemId,
            productId: i.productId,
            productName: i.productName,
            optionName: i.optionName,
            thumbnailUrl: i.thumbnailUrl,
            writableUntil: new Date(
              new Date(o.orderedAt).getTime() + 40 * 86_400_000,
            ).toISOString(),
          })),
      );
      return { data: list };
    },
  ],
  [
    "POST",
    /^\/me\/order-items\/([^/]+)\/review$/,
    (req) => {
      const m = requireMember(req);
      const { item } = findItem(m.memberId, req.params[0] as string);
      if (!item.reviewWritable || item.reviewWritten)
        fail(409, "REVIEW_NOT_WRITABLE", "리뷰를 쓸 수 없는 상품입니다");
      const body = req.body as { rating: number; content: string; images?: string[] };
      const review: MyReview = {
        reviewId: newId("rev"),
        productId: item.productId,
        productName: item.productName,
        thumbnailUrl: item.thumbnailUrl,
        optionName: item.optionName,
        rating: body.rating,
        content: body.content,
        images: body.images ?? [],
        sellerReply: null,
        blinded: false,
        editable: true,
        editableUntil: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        createdAt: now(),
      };
      reviews.set(m.memberId, [review, ...(reviews.get(m.memberId) ?? [])]);
      item.reviewWritten = true;
      item.reviewWritable = false;
      return {
        status: 201,
        data: { reviewId: review.reviewId, rewardPoint: review.images.length ? 500 : 300 },
      };
    },
  ],
  [
    "PUT",
    /^\/me\/reviews\/([^/]+)$/,
    (req) => {
      const m = requireMember(req);
      const review = (reviews.get(m.memberId) ?? []).find((r) => r.reviewId === req.params[0]);
      if (!review?.editable) fail(409, "REVIEW_NOT_EDITABLE", "수정할 수 없는 리뷰입니다");
      Object.assign(review, req.body as Partial<MyReview>);
      return {};
    },
  ],
  [
    "DELETE",
    /^\/me\/reviews\/([^/]+)$/,
    (req) => {
      const m = requireMember(req);
      reviews.set(
        m.memberId,
        (reviews.get(m.memberId) ?? []).filter((r) => r.reviewId !== req.params[0]),
      );
      return {};
    },
  ],
  [
    "POST",
    /^\/me\/uploads$/,
    (req) => ({
      data: {
        url: `${req.origin}/mock/review-dog-2.svg`,
        uploadUrl: `${req.origin}/mock-api/upload`,
      },
    }),
  ],
  [
    "GET",
    /^\/me\/inquiries$/,
    (req) => {
      const m = requireMember(req);
      const mine = state.inquiries
        .filter((i) => i.writerMaskedName === `mine:${m.memberId}`)
        .map((i) => ({ ...i, writerMaskedName: "나" }));
      return { data: pageOf(mine, req.query) };
    },
  ],
  [
    "GET",
    /^\/me\/customer-inquiries$/,
    (req) => {
      const m = requireMember(req);
      return { data: pageOf(customerInquiries.get(m.memberId) ?? [], req.query) };
    },
  ],
  [
    "GET",
    /^\/me\/customer-inquiries\/([^/]+)$/,
    (req) => {
      const m = requireMember(req);
      const found = (customerInquiries.get(m.memberId) ?? []).find(
        (i) => i.inquiryId === req.params[0],
      );
      if (!found) fail(404, "INQUIRY_NOT_FOUND", "문의를 찾을 수 없습니다");
      return { data: found };
    },
  ],
  [
    "POST",
    /^\/me\/customer-inquiries$/,
    (req) => {
      const m = requireMember(req);
      const body = req.body as Pick<CustomerInquiry, "category" | "title" | "content"> & {
        orderItemId?: string;
      };
      const inquiry: CustomerInquiry = {
        inquiryId: newId("cinq"),
        category: body.category,
        title: body.title,
        content: body.content,
        orderItemId: body.orderItemId ?? null,
        answered: false,
        answer: null,
        createdAt: now(),
      };
      customerInquiries.set(m.memberId, [inquiry, ...(customerInquiries.get(m.memberId) ?? [])]);
      return { status: 201, data: inquiry };
    },
  ],
  [
    "GET",
    /^\/me\/points$/,
    (req) => {
      const m = requireMember(req);
      return { data: { balance: pointBalanceOf(m.memberId), expiringSoon: 500 } };
    },
  ],
  [
    "GET",
    /^\/me\/points\/history$/,
    (req) => {
      const m = requireMember(req);
      const balance = pointBalanceOf(m.memberId);
      const entries = [
        {
          entryId: "pt_3",
          type: "REVIEW_REWARD",
          amount: 500,
          balanceAfter: 3500,
          createdAt: "2026-10-15T03:00:00.000Z",
        },
        {
          entryId: "pt_2",
          type: "PURCHASE_EARN",
          amount: 390,
          balanceAfter: 3000,
          createdAt: "2026-09-28T03:00:00.000Z",
        },
        {
          entryId: "pt_1",
          type: "SIGNUP",
          amount: 2610,
          balanceAfter: 2610,
          createdAt: "2026-09-01T03:00:00.000Z",
        },
      ];
      const used = 3500 - balance;
      return {
        data: pageOf(
          used > 0
            ? [
                {
                  entryId: "pt_use",
                  type: "USE",
                  amount: -used,
                  balanceAfter: balance,
                  createdAt: now(),
                },
                ...entries,
              ]
            : entries,
          req.query,
        ),
      };
    },
  ],
  [
    "GET",
    /^\/me\/addresses$/,
    (req) => {
      const m = requireMember(req);
      return { data: addresses.get(m.memberId) ?? [] };
    },
  ],
  [
    "POST",
    /^\/me\/addresses$/,
    (req) => {
      const m = requireMember(req);
      const body = req.body as Omit<MemberAddress, "addressId" | "countryCode" | "city" | "region">;
      const list = addresses.get(m.memberId) ?? [];
      const address: MemberAddress = {
        ...body,
        address2: body.address2 ?? null,
        addressId: newId("addr"),
        countryCode: "KR",
        city: null,
        region: null,
        isDefault: body.isDefault || list.length === 0,
      };
      const next = address.isDefault ? list.map((a) => ({ ...a, isDefault: false })) : list;
      addresses.set(m.memberId, [...next, address]);
      return { status: 201 };
    },
  ],
  [
    "PUT",
    /^\/me\/addresses\/([^/]+)$/,
    (req) => {
      const m = requireMember(req);
      const body = req.body as Partial<MemberAddress>;
      const list = (addresses.get(m.memberId) ?? []).map((a) =>
        a.addressId === req.params[0]
          ? { ...a, ...body, address2: body.address2 ?? null }
          : body.isDefault
            ? { ...a, isDefault: false }
            : a,
      );
      addresses.set(m.memberId, list);
      return {};
    },
  ],
  [
    "DELETE",
    /^\/me\/addresses\/([^/]+)$/,
    (req) => {
      const m = requireMember(req);
      addresses.set(
        m.memberId,
        (addresses.get(m.memberId) ?? []).filter((a) => a.addressId !== req.params[0]),
      );
      return {};
    },
  ],
];
