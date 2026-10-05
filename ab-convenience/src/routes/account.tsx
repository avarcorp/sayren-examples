import {
  ApiError,
  type SocialProvider,
  withdrawalBlockedDetailsSchema,
} from "@sayren/storefront-sdk";
import { createFileRoute, Link, redirect, useHydrated, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { LogoutButton, MyPageMenuList } from "../components/my-page-nav";
import { MyPageShell } from "../components/mypage/my-page-shell";
import { OrderCard } from "../components/mypage/order-card";
import { SubmitButton } from "../components/submit-button";
import { buttonClass, inputClass } from "../components/ui/button";
import { InfoList, SectionHeader } from "../components/ui/section";
import { lazyMessages, m } from "../i18n";
import { apiFor, authFor } from "../lib/api.server";
import { clearDirectLine } from "../lib/direct-checkout.server";
import { formatDateTime, formatPrice } from "../lib/format";
import { ORDER_STAGE_LABELS, ORDER_STAGES, orderStageCounts } from "../lib/order-status";
import { pageTitle } from "../lib/page-title";
import { readToken, signOut } from "../lib/session.server";
import { SOCIAL_BUTTONS } from "../lib/social-buttons";
import { writeSocialLogin } from "../lib/social-login.server";

const PROVIDER_NAME = lazyMessages<SocialProvider>({
  kakao: () => m.account_provider_kakao(),
  naver: () => m.account_provider_naver(),
  google: () => m.account_provider_google(),
});

const accountSearch = z.object({
  /** 「내 정보」(로그인 수단·약관·탈퇴). 없으면 마이페이지 홈이다 */
  view: z.enum(["profile"]).optional().catch(undefined),
  linked: z.enum(["kakao", "naver", "google"]).optional().catch(undefined),
  error: z.string().optional().catch(undefined),
});

/** 주문 처리 현황·최근 주문의 기간 — 최근 3개월 */
const RECENT_DAYS = 92;
const RECENT_ORDERS = 3;

/**
 * 마이페이지 홈 — 요약(보유 쿠폰·적립금·작성 가능한 리뷰), 최근 3개월 주문 상품의 단계별 개수, 최근 주문.
 * 단계 개수는 별도 집계 API가 없어 최근 3개월 주문 목록(최대 100건)의 상품 상태로 센다.
 * 요약 숫자는 하나가 실패해도 홈은 열린다(적립금이 꺼진 상점은 `points`가 null이다).
 */
const getMyPageHome = createServerFn({ method: "GET" }).handler(async () => {
  const accessToken = readToken();
  if (!accessToken) throw redirect({ to: "/login", search: { redirectTo: "/account" } });
  const api = apiFor({ accessToken });
  const from = new Date(Date.now() - RECENT_DAYS * 86_400_000).toISOString();
  const [me, orders, points, coupons, writable] = await Promise.all([
    api.member.me(),
    api.myOrders.list({ from, size: 100 }).catch(() => null),
    api.member.getPoints().catch(() => null),
    api.me.coupons({ status: "available" }).catch(() => null),
    api.reviews.listWritable().catch(() => null),
  ]);
  return {
    me,
    stages: orders ? orderStageCounts(orders.contents) : null,
    recentOrders: orders?.contents.slice(0, RECENT_ORDERS) ?? [],
    points: points?.balance ?? null,
    coupons: coupons?.length ?? null,
    writableReviews: writable?.length ?? null,
  };
});

/** 내 정보와 로그인 수단 — 로그인하지 않았으면 로그인 화면으로 보낸다 */
const getAccount = createServerFn({ method: "GET" }).handler(async () => {
  const accessToken = readToken();
  if (!accessToken)
    throw redirect({ to: "/login", search: { redirectTo: "/account?view=profile" } });
  const [me, identities, store, consents] = await Promise.all([
    apiFor({ accessToken }).member.me(),
    authFor().identities(accessToken),
    apiFor().store.get(),
    apiFor({ accessToken }).member.consents(),
  ]);
  // 셀러가 켠 소셜 로그인만 연결할 수 있다
  const providers = store.loginMethods.filter(
    (method): method is SocialProvider => method !== "password",
  );
  return { me, identities, providers, consents };
});

const providerInput = z.object({ provider: z.enum(["kakao", "naver", "google"]) });

const consentInput = z.object({
  /** 개정된 필수 약관 재동의 */
  reconsent: z.boolean().optional(),
  /** 마케팅 수신 동의·철회 */
  marketing: z.boolean().optional(),
});

/** 재동의·마케팅 동의 변경 — 구매자 토큰은 서버에만 두므로 서버 함수에서 부른다 */
const changeConsents = createServerFn({ method: "POST" })
  .validator(consentInput)
  .handler(async ({ data }) => {
    const accessToken = readToken();
    if (!accessToken) return { error: m.account_login_again() };
    try {
      await apiFor({ accessToken }).member.updateConsents({
        ...(data.reconsent ? { terms: true as const, privacy: true as const } : {}),
        ...(data.marketing === undefined ? {} : { marketing: data.marketing }),
      });
      return { error: null };
    } catch (error) {
      return { error: accountErrorMessage(error) };
    }
  });

/**
 * 소셜 계정 연결 시작 — 로그인과 같은 콜백(`/auth/callback`)으로 돌아오고, 쿠키의 `linkProvider`로 연결임을 안다.
 * 연결은 흐름을 시작한 이 구매자에게만 된다(서버가 확인한다).
 */
const startLink = createServerFn({ method: "POST" })
  .validator(providerInput)
  .handler(async ({ data }) => {
    const accessToken = readToken();
    if (!accessToken) return { url: null, error: m.account_login_again() };
    const origin = new URL(getRequestUrl()).origin;
    try {
      const started = await authFor().linkIdp(accessToken, data.provider, {
        redirectUri: `${origin}/auth/callback`,
      });
      writeSocialLogin({
        state: started.state,
        codeVerifier: started.codeVerifier,
        redirectTo: "/account",
        linkProvider: data.provider,
      });
      return { url: started.url, error: null };
    } catch (error) {
      return { url: null, error: accountErrorMessage(error) };
    }
  });

const unlink = createServerFn({ method: "POST" })
  .validator(providerInput)
  .handler(async ({ data }) => {
    const accessToken = readToken();
    if (!accessToken) return { error: m.account_login_again() };
    try {
      await authFor().unlinkIdp(accessToken, data.provider);
      return { error: null };
    } catch (error) {
      return { error: accountErrorMessage(error) };
    }
  });

/**
 * 회원 탈퇴 — 되돌릴 수 없다. 비밀번호가 있는 구매자는 비밀번호를 다시 받는다. 소셜 로그인만 쓰는 구매자는
 * 최근 10분 안에 로그인한 세션이어야 한다(아니면 403 `REAUTH_REQUIRED`). 성공하면 세션 쿠키를 지운다.
 */
const withdraw = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().optional() }))
  .handler(async ({ data }) => {
    const accessToken = readToken();
    if (!accessToken) return { error: m.account_login_again() };
    try {
      await authFor().withdraw(accessToken, { password: data.password || undefined });
      signOut();
      clearDirectLine();
      return { error: null };
    } catch (error) {
      return { error: withdrawErrorMessage(error) };
    }
  });

function withdrawErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return m.account_withdraw_failed();
  if (error.code === "WITHDRAWAL_BLOCKED") {
    const details = withdrawalBlockedDetailsSchema.safeParse(error.details);
    const reasons = details.success
      ? [
          details.data.inProgressOrderItems
            ? m.account_withdraw_reason_orders({ count: details.data.inProgressOrderItems })
            : null,
          details.data.openClaims
            ? m.account_withdraw_reason_claims({ count: details.data.openClaims })
            : null,
          details.data.pendingPayments
            ? m.account_withdraw_reason_payments({ count: details.data.pendingPayments })
            : null,
        ].filter(Boolean)
      : [];
    return reasons.length
      ? m.account_withdraw_blocked({ reasons: reasons.join(", ") })
      : m.account_withdraw_blocked_default();
  }
  if (error.code === "PASSWORD_MISMATCH") return m.account_withdraw_password_mismatch();
  if (error.code === "PASSWORD_REQUIRED") return m.account_withdraw_password_required();
  if (error.code === "REAUTH_REQUIRED") return m.account_withdraw_reauth_required();
  if (error.code === "ACCOUNT_LOCKED") return m.account_withdraw_locked();
  return m.account_withdraw_failed();
}

const ERROR_MESSAGE: Readonly<Record<string, string>> = lazyMessages({
  IDENTITY_IN_USE: () => m.account_identity_in_use(),
  PROVIDER_ALREADY_LINKED: () => m.account_provider_already_linked(),
  LAST_LOGIN_METHOD: () => m.account_last_login_method(),
  access_denied: () => m.account_link_access_denied(),
  state_mismatch: () => m.account_link_state_mismatch(),
});

function accountErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return ERROR_MESSAGE[error.code] ?? m.account_action_failed();
  return m.account_action_failed();
}

export const Route = createFileRoute("/account")({
  validateSearch: accountSearch,
  // 소셜 계정 연결 콜백은 `?linked=`·`?error=`를 달고 `/account`로 돌아온다 — 그때도 내 정보를 연다
  loaderDeps: ({ search }) => ({
    profile: search.view === "profile" || Boolean(search.linked || search.error),
  }),
  loader: async ({ deps }) =>
    deps.profile
      ? { view: "profile" as const, account: await getAccount() }
      : { view: "home" as const, home: await getMyPageHome() },
  head: ({ matches, loaderData }) => ({
    meta: [
      {
        title: pageTitle(
          matches,
          loaderData?.view === "profile" ? m.mypage_profile_title() : m.account_title(),
        ),
      },
    ],
  }),
  component: Account,
});

function Account() {
  const data = Route.useLoaderData();
  if (data.view === "profile") return <Profile {...data.account} />;
  return <MyPageHome {...data.home} />;
}

type HomeData = Awaited<ReturnType<typeof getMyPageHome>>;

/** 요약 칸 — 모바일은 3칸 표, 데스크톱은 잉크 이름 블록 옆에 이어진다 */
const STAT =
  "flex min-w-0 flex-col items-center gap-1 border-line border-r px-1 py-3.5 text-center last:border-r-0 hover:bg-chip lg:items-start lg:gap-1.5 lg:px-6 lg:py-5 lg:text-left";

function Stat({
  to,
  label,
  value,
}: {
  to: "/coupons" | "/points" | "/account/reviews";
  label: string;
  value: string;
}) {
  return (
    <Link to={to} className={STAT}>
      <span className="break-keep text-caption text-sub lg:text-meta">{label}</span>
      <span className="tabular break-all font-bold text-[1.0625rem] lg:text-[1.375rem]">
        {value}
      </span>
    </Link>
  );
}

function MyPageHome({ me, stages, recentOrders, points, coupons, writableReviews }: HomeData) {
  return (
    <MyPageShell current="home" title={m.account_title()}>
      <section
        aria-label={m.mypage_greeting({ name: me.name })}
        className="flex min-w-0 flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))] lg:gap-0 lg:border lg:border-ink"
      >
        <Link
          to="/account"
          search={{ view: "profile" }}
          className="flex min-w-0 items-center justify-between gap-3 lg:bg-brand-strong lg:px-7 lg:py-5 lg:text-white"
        >
          <span className="flex min-w-0 flex-col gap-1">
            <span className="break-words font-bold text-xl">
              {m.mypage_greeting({ name: me.name })}
            </span>
            {me.email ? (
              <span className="break-all text-meta text-muted lg:text-line-strong">{me.email}</span>
            ) : null}
          </span>
          <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted lg:hidden" />
        </Link>
        <div className="grid min-w-0 grid-cols-3 border border-line lg:contents">
          <Stat
            to="/coupons"
            label={m.mypage_stat_coupons()}
            value={coupons == null ? "-" : m.mypage_count_coupons({ count: coupons })}
          />
          <Stat
            to="/points"
            label={m.mypage_stat_points()}
            value={points == null ? "-" : formatPrice(points)}
          />
          <Stat
            to="/account/reviews"
            label={m.mypage_stat_reviews()}
            value={
              writableReviews == null ? "-" : m.mypage_count_reviews({ count: writableReviews })
            }
          />
        </div>
      </section>

      {stages ? (
        <section aria-labelledby="mypage-stages" className="flex min-w-0 flex-col gap-4">
          <SectionHeader
            id="mypage-stages"
            title={m.mypage_stages_title()}
            rule
            action={<span className="text-caption text-muted">{m.mypage_stages_period()}</span>}
          />
          <ol className="grid grid-cols-5 border-line border-b pt-1 pb-4 text-center">
            {ORDER_STAGES.map((stage) => {
              const count = stages[stage];
              const color =
                count === 0 ? "text-line-strong" : stage === "SHIPPING" ? "text-info" : "text-ink";
              return (
                <li key={stage} className="flex min-w-0 flex-col gap-1 md:gap-1.5">
                  <span className={`tabular font-bold text-xl md:text-[1.625rem] ${color}`}>
                    {count}
                  </span>
                  <span className="break-keep text-[0.6875rem] text-sub md:text-meta">
                    {ORDER_STAGE_LABELS[stage]}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <section aria-labelledby="mypage-recent" className="flex min-w-0 flex-col gap-4">
        <SectionHeader
          id="mypage-recent"
          title={m.mypage_recent_orders()}
          action={
            <Link
              to="/orders"
              className="flex shrink-0 items-center text-meta text-sub hover:text-ink"
            >
              {m.mypage_view_all()}
              <ChevronRight aria-hidden="true" className="size-3.5" />
            </Link>
          }
        />
        {recentOrders.length ? (
          <div className="flex flex-col gap-3">
            {recentOrders.map((order) => (
              <OrderCard key={order.orderId} order={order} />
            ))}
          </div>
        ) : (
          <p className="border border-line py-10 text-center text-body text-muted">
            {m.mypage_recent_orders_empty()}
          </p>
        )}
      </section>

      <MyPageMenuList />
    </MyPageShell>
  );
}

type ProfileData = Awaited<ReturnType<typeof getAccount>>;

const LIST = "divide-y divide-line border border-line";
const ROW = "flex min-w-0 items-center justify-between gap-3 px-4 py-4 md:px-5";
const SMALL = buttonClass({ variant: "subtle", size: "sm" });

function Profile({ me, identities, providers, consents }: ProfileData) {
  const { linked, error: callbackError } = Route.useSearch();
  const router = useRouter();
  // 하이드레이션 전의 클릭은 핸들러가 없어 사라진다 — 그동안은 버튼을 막는다(`SubmitButton`과 같다)
  const hydrated = useHydrated();
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const error =
    actionError ??
    (callbackError ? (ERROR_MESSAGE[callbackError] ?? m.account_link_failed()) : null);

  const changeConsent = (data: { reconsent?: boolean; marketing?: boolean }) => {
    setPending(true);
    setActionError(null);
    void changeConsents({ data }).then(async (result) => {
      if (result.error) setActionError(result.error);
      await router.invalidate();
      setPending(false);
    });
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const [action, provider] = (submitter?.value ?? "").split(":") as [string, SocialProvider];
    if (!provider) return;
    setPending(true);
    setActionError(null);
    if (action === "link") {
      void startLink({ data: { provider } }).then((result) => {
        // 공급자 화면은 다른 사이트라 문서째 이동한다
        if (result.url) window.location.assign(result.url);
        else {
          setActionError(result.error);
          setPending(false);
        }
      });
      return;
    }
    void unlink({ data: { provider } }).then(async (result) => {
      if (result.error) setActionError(result.error);
      await router.invalidate();
      setPending(false);
    });
  };

  return (
    <MyPageShell current="profile" title={m.mypage_profile_title()}>
      <section aria-labelledby="profile-basic" className="flex min-w-0 flex-col gap-4">
        <SectionHeader id="profile-basic" title={m.mypage_profile_basic()} rule />
        <InfoList
          rows={[
            { key: "name", label: m.mypage_profile_name(), value: me.name },
            { key: "email", label: m.mypage_profile_email(), value: me.email ?? "-" },
          ]}
        />
      </section>

      <section aria-labelledby="profile-methods" className="flex min-w-0 flex-col gap-4">
        <SectionHeader id="profile-methods" title={m.account_login_methods()} rule />
        {linked ? (
          <p role="status" className="bg-chip px-4 py-3 text-body">
            {m.account_linked({ provider: PROVIDER_NAME[linked] })}
          </p>
        ) : null}
        <form onSubmit={submit}>
          <ul className={LIST}>
            <li className={ROW}>
              <span className="font-bold text-body">{m.account_email_password()}</span>
              <span className="shrink-0 text-meta text-muted">
                {identities.hasPassword ? m.account_method_in_use() : m.account_method_none()}
              </span>
            </li>
            {identities.hasExternalAuth ? (
              <li className={ROW}>
                <span className="font-bold text-body">{m.account_external_auth()}</span>
                <span className="shrink-0 text-meta text-muted">{m.account_method_in_use()}</span>
              </li>
            ) : null}
            {providers.map((provider) => {
              const identity = identities.identities.find((item) => item.provider === provider);
              return (
                <li key={provider} className={ROW}>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-bold text-body">{PROVIDER_NAME[provider]}</span>
                    <span className="break-all text-caption text-muted">
                      {identity
                        ? m.account_identity_linked({
                            email: identity.email ?? m.account_identity_email_hidden(),
                            linkedAt: formatDateTime(identity.linkedAt),
                          })
                        : m.account_identity_not_linked()}
                    </span>
                  </span>
                  {identity ? (
                    <SubmitButton
                      value={`unlink:${provider}`}
                      disabled={pending || !hydrated}
                      className={SMALL}
                    >
                      {m.account_unlink()}
                    </SubmitButton>
                  ) : (
                    <SubmitButton
                      value={`link:${provider}`}
                      disabled={pending || !hydrated}
                      className={`inline-flex h-10 shrink-0 items-center px-3.5 font-bold text-meta disabled:opacity-50 ${SOCIAL_BUTTONS[provider].className}`}
                    >
                      {m.account_link()}
                    </SubmitButton>
                  )}
                </li>
              );
            })}
          </ul>
        </form>
        {error ? (
          <p role="alert" className="text-body text-point">
            {error}
          </p>
        ) : null}
        <p className="text-caption text-muted">{m.account_login_methods_notice()}</p>
      </section>

      <section aria-labelledby="profile-consents" className="flex min-w-0 flex-col gap-4">
        <SectionHeader id="profile-consents" title={m.account_consents()} rule />
        <ul className={LIST}>
          <li className={ROW}>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-bold text-body">{m.account_consent_terms_privacy()}</span>
              <span
                className={`text-caption ${consents.reconsentRequired ? "text-point" : "text-muted"}`}
              >
                {consents.reconsentRequired
                  ? m.account_reconsent_required()
                  : m.account_consent_agreed({ version: consents.terms.agreedVersion ?? "-" })}
              </span>
              {/* 상점이 약관 주소를 정했으면 열어 볼 수 있게 한다 */}
              <span className="flex flex-wrap gap-x-3 text-caption">
                {consents.terms.currentDocumentUrl ? (
                  <a
                    href={consents.terms.currentDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted underline"
                  >
                    {m.account_terms_document()}
                  </a>
                ) : null}
                {consents.privacy.currentDocumentUrl ? (
                  <a
                    href={consents.privacy.currentDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted underline"
                  >
                    {m.account_privacy_document()}
                  </a>
                ) : null}
              </span>
            </span>
            {consents.reconsentRequired ? (
              <button
                type="button"
                disabled={pending || !hydrated}
                onClick={() => changeConsent({ reconsent: true })}
                className={buttonClass({ variant: "primary", size: "sm" })}
              >
                {m.account_reconsent()}
              </button>
            ) : null}
          </li>
          <li className={ROW}>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-bold text-body">{m.account_marketing()}</span>
              <span className="text-caption text-muted">
                {consents.marketing.agreed
                  ? m.account_marketing_agreed()
                  : m.account_marketing_not_agreed()}
              </span>
            </span>
            <button
              type="button"
              disabled={pending || !hydrated}
              onClick={() => changeConsent({ marketing: !consents.marketing.agreed })}
              className={SMALL}
            >
              {consents.marketing.agreed
                ? m.account_marketing_opt_out()
                : m.account_marketing_opt_in()}
            </button>
          </li>
        </ul>
      </section>

      <section aria-labelledby="profile-account" className="flex min-w-0 flex-col gap-4">
        <SectionHeader id="profile-account" title={m.account_section()} rule />
        <div>
          <LogoutButton className={SMALL} />
        </div>
        <WithdrawForm hasPassword={identities.hasPassword} />
      </section>
    </MyPageShell>
  );
}

/** 회원 탈퇴 — 확인을 한 번 더 받는다. 주문·리뷰·문의 기록은 상점이 보관한다 */
function WithdrawForm({ hasPassword }: { hasPassword: boolean }) {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        disabled={!hydrated}
        onClick={() => setOpen(true)}
        className="self-start text-meta text-muted underline underline-offset-4 disabled:opacity-50"
      >
        {m.account_withdraw()}
      </button>
    );
  }
  return (
    <form
      aria-label={m.account_withdraw()}
      className="flex flex-col gap-4 bg-chip p-4 text-body md:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        setError(null);
        void withdraw({ data: { password: String(form.get("password") ?? "") } })
          .then((result) => {
            if (!result.error) {
              window.location.assign("/");
              return;
            }
            setError(result.error);
            setPending(false);
          })
          .catch(() => {
            setError(m.account_withdraw_failed());
            setPending(false);
          });
      }}
    >
      <p>{m.account_withdraw_notice()}</p>
      {hasPassword ? (
        <label className="flex flex-col gap-1.5">
          <span className="font-bold text-meta">{m.account_withdraw_password()}</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            className={inputClass()}
          />
        </label>
      ) : (
        <p className="text-caption text-muted">{m.account_withdraw_social_notice()}</p>
      )}
      {error ? (
        <p role="alert" className="text-point">
          {error}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <SubmitButton
          disabled={pending}
          className={buttonClass({ variant: "primary", size: "md" })}
        >
          {m.account_withdraw_submit()}
        </SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={buttonClass({ variant: "ghost" })}
        >
          {m.account_withdraw_cancel()}
        </button>
      </div>
    </form>
  );
}
