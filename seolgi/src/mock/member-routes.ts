import type { MyCoupon, StorefrontCoupon } from "@sayren/storefront-sdk";
import { mockProducts } from "./catalog";
import { findProduct } from "./catalog-routes";
import { fail, newId, now, pageOf, type Route } from "./http";
import { memberIdOf, requireMember, state } from "./state";

/** 상점이 배포 중인 쿠폰 — 상세의 「쿠폰 받기」와 주문서 쿠폰에 쓴다 */
export const storeCoupons: StorefrontCoupon[] = [
  {
    couponId: "cpn_first10",
    name: "첫 구매 10% 쿠폰",
    description: "20,000원 이상 주문에 쓸 수 있습니다",
    kind: "ORDER",
    benefit: { type: "RATE", value: 10, maxDiscountAmount: 5000 },
    minOrderAmount: 20000,
    stackWithInstantDiscount: true,
    target: {
      allProducts: true,
      includeProductIds: [],
      includeCategoryIds: [],
      excludeProductIds: [],
      excludeCategoryIds: [],
    },
    startsAt: "2026-10-01T00:00:00.000Z",
    endsAt: "2026-12-31T14:59:59.000Z",
    validDaysAfterIssue: 30,
    perMemberIssueLimit: 1,
    loginRequired: true,
    downloaded: null,
    downloadable: null,
  },
  {
    couponId: "cpn_walk3000",
    name: "산책 용품 3,000원 쿠폰",
    description: "산책 카테고리 상품에 쓸 수 있습니다",
    kind: "PRODUCT",
    benefit: { type: "AMOUNT", value: 3000, maxDiscountAmount: null },
    minOrderAmount: 25000,
    stackWithInstantDiscount: true,
    target: {
      allProducts: false,
      includeProductIds: [],
      includeCategoryIds: ["cat_cbfb2b50a6ff"],
      excludeProductIds: [],
      excludeCategoryIds: [],
    },
    startsAt: "2026-10-01T00:00:00.000Z",
    endsAt: "2026-11-30T14:59:59.000Z",
    validDaysAfterIssue: 14,
    perMemberIssueLimit: 1,
    loginRequired: true,
    downloaded: null,
    downloadable: null,
  },
];

const WALK_TOP = "cat_cbfb2b50a6ff";
const WALK = new Set([
  WALK_TOP,
  "cat_763d23797036",
  "cat_62812caee72c",
  "cat_30ab2540d16c",
  "cat_f216fc930a49",
]);

/** 쿠폰이 이 상품에 쓰이는가 */
export function couponTargets(coupon: StorefrontCoupon, productId: string): boolean {
  if (coupon.target.allProducts) return true;
  const product = mockProducts.find((p) => p.card.productId === productId);
  return Boolean(
    product && coupon.target.includeCategoryIds.includes(WALK_TOP) && WALK.has(product.categoryId),
  );
}

export function myCouponsOf(memberId: string): MyCoupon[] {
  if (!state.coupons.has(memberId)) {
    state.coupons.set(memberId, [
      {
        issueId: `iss_${memberId}_welcome`,
        couponId: "cpn_welcome2000",
        name: "회원가입 축하 2,000원 쿠폰",
        description: null,
        kind: "ORDER",
        benefit: { type: "AMOUNT", value: 2000, maxDiscountAmount: null },
        minOrderAmount: 10000,
        status: "AVAILABLE",
        validFrom: "2026-09-01T00:00:00.000Z",
        validUntil: "2026-12-31T14:59:59.000Z",
        usedOrderId: null,
        issuedAt: "2026-09-01T00:00:00.000Z",
        source: "SIGNUP",
      },
    ]);
  }
  return state.coupons.get(memberId) as MyCoupon[];
}

export const memberRoutes: Route[] = [
  [
    "GET",
    /^\/coupons$/,
    (req) => {
      const memberId = memberIdOf(req);
      const productId = req.query.get("productId");
      const mine = memberId ? myCouponsOf(memberId) : [];
      const list = storeCoupons
        .filter((c) => !productId || couponTargets(c, productId))
        .map((c) => {
          const downloaded = memberId ? mine.some((m) => m.couponId === c.couponId) : null;
          return { ...c, downloaded, downloadable: memberId ? !downloaded : null };
        });
      return { data: pageOf(list, req.query) };
    },
  ],
  [
    "POST",
    /^\/coupons\/([^/]+)\/download$/,
    (req) => {
      const member = requireMember(req);
      const coupon = storeCoupons.find((c) => c.couponId === req.params[0]);
      if (!coupon) fail(404, "COUPON_NOT_FOUND", "쿠폰을 찾을 수 없습니다");
      const mine = myCouponsOf(member.memberId);
      if (mine.some((m) => m.couponId === coupon.couponId))
        fail(409, "COUPON_ALREADY_DOWNLOADED", "이미 받은 쿠폰입니다");
      const issued: MyCoupon = {
        issueId: newId("iss"),
        couponId: coupon.couponId,
        name: coupon.name,
        description: coupon.description,
        kind: coupon.kind,
        benefit: coupon.benefit,
        minOrderAmount: coupon.minOrderAmount,
        status: "AVAILABLE",
        validFrom: now(),
        validUntil: coupon.endsAt,
        usedOrderId: null,
        issuedAt: now(),
        source: "DOWNLOAD",
      };
      mine.unshift(issued);
      return { status: 201, data: issued };
    },
  ],
  [
    "GET",
    /^\/me\/coupons$/,
    (req) => {
      const member = requireMember(req);
      const status = req.query.get("status");
      const list = myCouponsOf(member.memberId).filter(
        (c) =>
          !status ||
          c.status === { available: "AVAILABLE", used: "USED", expired: "EXPIRED" }[status],
      );
      return { data: list };
    },
  ],
  [
    "GET",
    /^\/me\/wishlist$/,
    (req) => {
      const member = requireMember(req);
      const ids = state.wishlists.get(member.memberId) ?? [];
      const cards = ids.map((id) => findProduct(id)?.card).filter((c) => c !== undefined);
      return { data: pageOf(cards, req.query) };
    },
  ],
  [
    "POST",
    /^\/me\/wishlist$/,
    (req) => {
      const member = requireMember(req);
      const productId = (req.body as { productId: string }).productId;
      if (!findProduct(productId)) fail(404, "PRODUCT_NOT_FOUND", "상품을 찾을 수 없습니다");
      const ids = state.wishlists.get(member.memberId) ?? [];
      if (!ids.includes(productId)) ids.unshift(productId);
      state.wishlists.set(member.memberId, ids);
      return { status: 201, data: { productId, wished: true } };
    },
  ],
  [
    "DELETE",
    /^\/me\/wishlist\/([^/]+)$/,
    (req) => {
      const member = requireMember(req);
      state.wishlists.set(
        member.memberId,
        (state.wishlists.get(member.memberId) ?? []).filter((id) => id !== req.params[0]),
      );
      return {};
    },
  ],
];
