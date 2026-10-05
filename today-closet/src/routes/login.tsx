import { ApiError, type SocialProvider } from "@sayren/storefront-sdk";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { useState } from "react";
import { z } from "zod";
import { SubmitButton } from "../components/submit-button";
import { buttonClass, inputClass } from "../components/ui/button";
import { lazyMessages, m } from "../i18n";
import { apiFor, authFor } from "../lib/api.server";
import { clearCartToken, readCartToken } from "../lib/cart-session.server";
import { pageTitle } from "../lib/page-title";
import { safeRedirect } from "../lib/safe-redirect";
import { signIn } from "../lib/session.server";
import { SOCIAL_BUTTONS } from "../lib/social-buttons";
import { writeSocialLogin } from "../lib/social-login.server";

const loginSearch = z.object({
  redirectTo: z.string().optional().catch(undefined),
  error: z.string().optional().catch(undefined),
});

/** 켜진 로그인 방법 — 셀러가 상점 플랫폼 설정 › 로그인에서 켠 것만 온다 */
const getLoginMethods = createServerFn({ method: "GET" }).handler(async () => {
  const store = await apiFor().store.get();
  return store.loginMethods;
});

/**
 * 소셜 로그인 시작 — state·PKCE verifier를 쿠키에 두고 공급자 로그인 화면 주소를 돌려준다. 돌아오는 곳은
 * `/auth/callback`이고, 이 앱의 주소가 상점 플랫폼의 스토어프론트 도메인에 등록돼 있어야 한다.
 *
 * 가입 화면에서 약관 동의를 미리 받는다면 `agreements: { terms: true, privacy: true, marketing }`을 함께 넘긴다.
 * 이 템플릿은 로그인과 가입을 한 화면에서 받아(기존 회원의 로그인까지 막지 않으려고) 넘기지 않고,
 * 가입된 뒤 계정 화면(`/account`)에서 받는다.
 */
const startSocial = createServerFn({ method: "POST" })
  .validator(z.object({ provider: z.enum(["kakao", "naver", "google"]), redirectTo: z.unknown() }))
  .handler(async ({ data }) => {
    const origin = new URL(getRequestUrl()).origin;
    try {
      const started = await authFor().idp(data.provider, {
        redirectUri: `${origin}/auth/callback`,
      });
      writeSocialLogin({
        state: started.state,
        codeVerifier: started.codeVerifier,
        redirectTo: safeRedirect(data.redirectTo),
      });
      return { url: started.url, error: null };
    } catch (error) {
      return { url: null, error: loginErrorMessage(error) };
    }
  });

/**
 * 로그인 — 화면은 이 앱이 그리고, 확인은 sayren이 한다. 비회원으로 담아 둔 장바구니 토큰을 함께 보내면
 * 회원 장바구니로 합쳐지고 그 토큰은 닫힌다. 그래서 장바구니 쿠키도 지운다.
 */
const passwordLogin = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string(), password: z.string(), redirectTo: z.unknown() }))
  .handler(async ({ data }) => {
    const cartToken = readCartToken();
    try {
      const tokens = await authFor().session({
        email: data.email,
        password: data.password,
        cartToken: cartToken ?? undefined,
      });
      signIn(tokens);
      if (cartToken) clearCartToken();
      return { redirectTo: safeRedirect(data.redirectTo), error: null };
    } catch (error) {
      return { redirectTo: null, error: loginErrorMessage(error) };
    }
  });

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "INVALID_CREDENTIALS") return m.login_invalid_credentials();
    if (error.code === "PASSWORD_LOGIN_DISABLED") return m.login_password_disabled();
    if (error.code === "ACCOUNT_LOCKED") return m.login_account_locked();
    if (error.status === 400) return m.login_check_input();
  }
  return m.login_failed();
}

const CALLBACK_ERRORS: Readonly<Record<string, string>> = lazyMessages({
  access_denied: () => m.login_callback_access_denied(),
  state_mismatch: () => m.login_callback_state_mismatch(),
});

export const Route = createFileRoute("/login")({
  validateSearch: loginSearch,
  loader: () => getLoginMethods(),
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, m.login_title()) }] }),
  component: Login,
});

function Login() {
  const loginMethods = Route.useLoaderData();
  const { redirectTo, error: callbackError } = Route.useSearch();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const social = loginMethods.filter((method): method is SocialProvider => method !== "password");
  const password = loginMethods.includes("password");
  const error =
    actionError ??
    (callbackError ? (CALLBACK_ERRORS[callbackError] ?? m.login_callback_failed()) : null);

  const submitSocial = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const provider = submitter?.value as SocialProvider | undefined;
    if (!provider) return;
    setPending(true);
    void startSocial({ data: { provider, redirectTo } }).then((result) => {
      // 공급자 로그인 화면은 다른 사이트라 문서째 이동한다
      if (result.url) window.location.assign(result.url);
      else {
        setActionError(result.error);
        setPending(false);
      }
    });
  };

  const submitPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    void passwordLogin({
      data: {
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        redirectTo,
      },
    }).then((result) => {
      // 로그인 상태가 모든 화면에 새로 반영되도록 문서째 이동한다
      if (result.redirectTo) window.location.assign(result.redirectTo);
      else {
        setActionError(result.error);
        setPending(false);
      }
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 py-6 md:py-12">
      <h1 className="text-center font-bold text-2xl tracking-tight">{m.login_title()}</h1>
      {password ? (
        <form onSubmit={submitPassword} className="flex flex-col gap-2.5">
          <input
            type="email"
            name="email"
            aria-label={m.login_email()}
            placeholder={m.login_email()}
            autoComplete="email"
            required
            className={inputClass()}
          />
          <input
            type="password"
            name="password"
            aria-label={m.login_password()}
            placeholder={m.login_password()}
            autoComplete="current-password"
            required
            className={inputClass()}
          />
          <SubmitButton
            disabled={pending}
            className={buttonClass({
              variant: "primary",
              size: "lg",
              block: true,
              className: "mt-2",
            })}
          >
            {m.login_submit()}
          </SubmitButton>
        </form>
      ) : null}
      {error ? (
        <p role="alert" className="text-body text-point">
          {error}
        </p>
      ) : null}
      {social.length && password ? (
        <div className="flex items-center gap-3 text-caption text-muted">
          <span className="h-px flex-1 bg-line" />
          {m.mypage_or()}
          <span className="h-px flex-1 bg-line" />
        </div>
      ) : null}
      {social.length ? (
        <form onSubmit={submitSocial} className="flex flex-col gap-2">
          {social.map((provider) => (
            <SubmitButton
              key={provider}
              name="social"
              value={provider}
              disabled={pending}
              className={`flex h-12 w-full items-center justify-center font-bold text-body-lg disabled:opacity-50 ${SOCIAL_BUTTONS[provider].className}`}
            >
              {SOCIAL_BUTTONS[provider].label}
            </SubmitButton>
          ))}
          <p className="pt-1 text-center text-caption text-muted">
            {m.login_social_signup_notice()}
          </p>
        </form>
      ) : null}
      <div className="flex items-center justify-center gap-3 border-line border-t pt-6 text-meta">
        {/* 이메일·비밀번호 가입은 그 로그인 방법이 켜진 상점에서만 된다 */}
        {password ? (
          <>
            <Link to="/signup" search={{ redirectTo }} className="font-bold hover:underline">
              {m.login_signup()}
            </Link>
            <span aria-hidden="true" className="h-3 w-px bg-line-strong" />
          </>
        ) : null}
        <Link to="/guest-order" className="text-sub hover:underline">
          {m.login_guest_order()}
        </Link>
      </div>
    </div>
  );
}
