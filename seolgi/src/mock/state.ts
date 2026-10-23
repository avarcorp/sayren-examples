import type {
  AddonSelection,
  CustomInputEntry,
  MemberAddress,
  MyCoupon,
  MyOrder,
  PublicInquiry,
} from "@sayren/storefront-sdk";
import { fail, type MockRequest, newId } from "./http";

/**
 * mock 서버 상태 — dev 서버 프로세스 메모리에만 있다. 서버를 다시 띄우면 처음 상태로 돌아간다.
 * 구매자는 `mock.{memberId}` 액세스 토큰, 비회원은 `cart_mock…` 장바구니 토큰으로 구분한다.
 */
export interface CartLine {
  cartItemId: string;
  productId: string;
  optionId: string | null;
  quantity: number;
  addons: AddonSelection[];
  customInputs: CustomInputEntry[];
}

export interface MockMember {
  memberId: string;
  email: string;
  name: string;
  phone: string;
  createdAt: string;
  /** 필수 약관에 동의했는가 — 처음 보는 이메일로 로그인하면(소셜 첫 가입 흉내) false라 재동의 화면이 뜬다 */
  consented: boolean;
  marketing: boolean;
}

/**
 * 모듈을 다시 읽어도(dev 서버 HMR) 같은 값을 쓴다 — 고칠 때마다 장바구니·주문이 사라지지 않게 한다.
 * 처음 만들 때만 `init`을 부르고 `fresh`로 알려 준다(시드는 그때만 넣는다).
 */
export function persistent<T>(key: string, init: () => T): T {
  const store = globalThis as unknown as Record<string, unknown>;
  const name = `__seolgiMock_${key}`;
  if (!(name in store)) store[name] = init();
  return store[name] as T;
}

export const state = persistent("state", () => ({
  carts: new Map<string, CartLine[]>(),
  members: new Map<string, MockMember>(),
  wishlists: new Map<string, string[]>(),
  addresses: new Map<string, MemberAddress[]>(),
  orders: new Map<string, MyOrder[]>(),
  coupons: new Map<string, MyCoupon[]>(),
  inquiries: [] as PublicInquiry[],
  seeded: false,
}));

export const DEMO_MEMBER: MockMember = {
  memberId: "mem_mock_seolgi",
  email: "seolgi@example.com",
  name: "김설기",
  phone: "01012345678",
  createdAt: "2026-09-01T00:00:00.000Z",
  consented: true,
  marketing: false,
};
state.members.set(DEMO_MEMBER.memberId, DEMO_MEMBER);

export function memberIdOf(req: MockRequest): string | null {
  const auth = req.headers.get("authorization");
  const token = auth?.replace(/^Bearer\s+/i, "");
  if (!token?.startsWith("mock.")) return null;
  const memberId = token.slice(5);
  return state.members.has(memberId) ? memberId : null;
}

export function requireMember(req: MockRequest): MockMember {
  const id = memberIdOf(req);
  if (!id) fail(401, "UNAUTHORIZED", "로그인이 필요합니다");
  return state.members.get(id) as MockMember;
}

/** 장바구니 주인 — 회원이면 회원, 아니면 장바구니 토큰. 없으면 새 토큰을 발급한다(운영과 같다) */
export function cartOwner(req: MockRequest, issue: boolean): { key: string; issued?: string } {
  const memberId = memberIdOf(req);
  if (memberId) return { key: `m:${memberId}` };
  const token = req.headers.get("x-cart-token");
  if (token && state.carts.has(`c:${token}`)) return { key: `c:${token}` };
  if (!issue) fail(404, "CART_ITEM_NOT_FOUND", "장바구니 항목을 찾을 수 없습니다");
  const issued = newId("cart");
  state.carts.set(`c:${issued}`, []);
  return { key: `c:${issued}`, issued };
}

export function tokensFor(memberId: string) {
  return { accessToken: `mock.${memberId}`, refreshToken: `mockr.${memberId}`, expiresIn: 3600 };
}
