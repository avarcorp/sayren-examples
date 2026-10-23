import { fail, newId, now, type Route } from "./http";
import { DEMO_MEMBER, type MockMember, requireMember, state, tokensFor } from "./state";

/** 비회원 장바구니를 로그인한 회원 장바구니로 옮긴다(운영의 로그인 병합과 같은 결과) */
function mergeCart(cartToken: string | undefined, memberId: string) {
  if (!cartToken) return;
  const guest = state.carts.get(`c:${cartToken}`);
  if (!guest?.length) return;
  const mine = state.carts.get(`m:${memberId}`) ?? [];
  state.carts.set(`m:${memberId}`, [...mine, ...guest]);
  state.carts.delete(`c:${cartToken}`);
}

/** 회원 동의 상태 — 필수 약관에 동의하지 않았으면 재동의가 필요하다 */
function consentsOf(m: MockMember) {
  const one = (kind: "TERMS" | "PRIVACY" | "MARKETING", agreed: boolean) => ({
    kind,
    agreed,
    agreedVersion: agreed ? "2026-09" : null,
    currentVersion: "2026-09",
    currentDocumentUrl: null,
    updatedAt: agreed ? "2026-09-01T00:00:00.000Z" : null,
    reconsentRequired: kind !== "MARKETING" && !m.consented,
  });
  return {
    terms: one("TERMS", m.consented),
    privacy: one("PRIVACY", m.consented),
    marketing: one("MARKETING", m.marketing),
    reconsentRequired: !m.consented,
  };
}

export const authRoutes: Route[] = [
  [
    "POST",
    /^\/auth\/login$/,
    ({ body }) => {
      const { email, password, cartToken } = body as {
        email: string;
        password: string;
        cartToken?: string;
      };
      // mock은 비밀번호를 검사하지 않는다. 「wrong」만 틀린 비밀번호로 본다(오류 화면 확인용)
      if (password === "wrong")
        fail(401, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 맞지 않습니다");
      let member = [...state.members.values()].find((m) => m.email === email);
      if (!member) {
        member = {
          ...DEMO_MEMBER,
          memberId: newId("mem"),
          email,
          createdAt: now(),
          consented: false,
        };
        state.members.set(member.memberId, member);
      }
      mergeCart(cartToken, member.memberId);
      return { data: tokensFor(member.memberId) };
    },
  ],
  [
    "POST",
    /^\/auth\/signup$/,
    ({ body }) => {
      const b = body as { email: string; name: string; phone?: string; cartToken?: string };
      if ([...state.members.values()].some((m) => m.email === b.email))
        fail(409, "EMAIL_ALREADY_EXISTS", "이미 가입한 이메일입니다");
      const member = {
        memberId: newId("mem"),
        email: b.email,
        name: b.name,
        phone: b.phone ?? "",
        createdAt: now(),
        consented: true,
        marketing: false,
      };
      state.members.set(member.memberId, member);
      mergeCart(b.cartToken, member.memberId);
      return { status: 201, data: tokensFor(member.memberId) };
    },
  ],
  [
    "POST",
    /^\/auth\/token\/refresh$/,
    ({ body }) => {
      const token = (body as { refreshToken: string }).refreshToken;
      const memberId = token.startsWith("mockr.") ? token.slice(6) : "";
      if (!state.members.has(memberId)) fail(401, "INVALID_REFRESH_TOKEN", "다시 로그인하십시오");
      return { data: tokensFor(memberId) };
    },
  ],
  ["POST", /^\/auth\/logout$/, () => ({})],
  [
    "POST",
    /^\/auth\/withdraw$/,
    (req) => {
      const member = requireMember(req);
      state.members.delete(member.memberId);
      return {};
    },
  ],
  [
    "POST",
    /^\/auth\/idp\/([^/]+)\/authorize$/,
    (req) => ({
      // 소셜 로그인은 바깥 제공자로 가지 않고 바로 콜백으로 돌아온다
      data: {
        url: `${(req.body as { redirectUri: string }).redirectUri}?code=mock&state=${encodeURIComponent((req.body as { state: string }).state)}`,
      },
    }),
  ],
  ["POST", /^\/auth\/idp\/token$/, () => ({ data: tokensFor(DEMO_MEMBER.memberId) })],
  [
    "GET",
    /^\/me\/identities$/,
    (req) => {
      requireMember(req);
      return { data: { hasPassword: true, hasExternalAuth: false, identities: [] } };
    },
  ],
  [
    "GET",
    /^\/me$/,
    (req) => {
      const m = requireMember(req);
      return {
        data: {
          memberId: m.memberId,
          email: m.email,
          name: m.name,
          phone: m.phone || null,
          point: 3500,
          marketingAgreed: m.marketing,
          joinedAt: m.createdAt,
          reconsentRequired: false,
        },
      };
    },
  ],
  [
    "PATCH",
    /^\/me$/,
    (req) => {
      const m = requireMember(req);
      const b = req.body as { name?: string; phone?: string; marketingAgreed?: boolean };
      if (b.name) m.name = b.name;
      if (b.phone !== undefined) m.phone = b.phone;
      if (b.marketingAgreed !== undefined) m.marketing = b.marketingAgreed;
      return {};
    },
  ],
  ["GET", /^\/me\/consents$/, (req) => ({ data: consentsOf(requireMember(req)) })],
  [
    "POST",
    /^\/me\/consents$/,
    (req) => {
      const m = requireMember(req);
      const b = req.body as { terms?: boolean; privacy?: boolean; marketing?: boolean };
      if (b.terms && b.privacy) m.consented = true;
      if (b.marketing !== undefined) m.marketing = b.marketing;
      return { data: consentsOf(m) };
    },
  ],
  [
    "GET",
    /^\/point-policy$/,
    () => ({
      data: {
        reviewReward: { enabled: true, textPoint: 300, photoPoint: 500 },
        purchaseEarn: { enabled: true, rateBp: 100 },
        expiryDays: 365,
        review: { writableDays: 30, editableDays: 7 },
      },
    }),
  ],
];
