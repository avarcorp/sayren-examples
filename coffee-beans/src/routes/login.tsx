import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button, Container, ErrorText, Field, Input, PageTitle } from "../components/ui";
import { useStore } from "../hooks/use-catalog";
import { lazyMessages, m } from "../i18n";
import { sessionQuery } from "../lib/account-queries";
import { login, requestPasswordReset, startSocialLogin } from "../lib/auth-actions";

const SOCIAL = lazyMessages<"kakao" | "naver" | "google">({
  kakao: () => m.login_kakao(),
  naver: () => m.login_naver(),
  google: () => m.login_google(),
});

/** 로그인 — 상점이 켠 방법(`loginMethods`)만 보인다. 비회원 장바구니는 로그인하면 합쳐진다 */
export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    redirect: z.string().optional(),
    passwordReset: z.string().optional(),
  }),
  beforeLoad: async ({ context, search }) => {
    const member = await context.queryClient.ensureQueryData(sessionQuery());
    if (member)
      throw redirect({ to: search.redirect?.startsWith("/") ? search.redirect : "/account" });
  },
  component: LoginPage,
});

function LoginPage() {
  const store = useStore();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const socials = store.loginMethods.filter(
    (method): method is "kakao" | "naver" | "google" => method !== "password",
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    const result = await login({ data: { email, password, redirect: search.redirect } });
    setPending(false);
    if (!result.ok) return setError(result.message);
    await queryClient.invalidateQueries();
    await navigate({ to: result.data.redirect });
  };

  const social = async (provider: "kakao" | "naver" | "google") => {
    const result = await startSocialLogin({ data: { provider, redirect: search.redirect } });
    if (!result.ok) return setError(result.message);
    window.location.assign(result.data.url);
  };

  const reset = async () => {
    const result = await requestPasswordReset({ data: { email } });
    if (!result.ok) return setError(result.message);
    setResetSent(true);
  };

  return (
    <Container className="flex max-w-md flex-col gap-6 pt-8">
      <PageTitle>{m.login_title()}</PageTitle>
      {search.passwordReset === "done" ? (
        <p role="status" className="text-meta text-point">
          {m.login_password_changed()}
        </p>
      ) : null}
      {store.loginMethods.includes("password") ? (
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <Field label={m.login_email()}>
            <Input
              type="email"
              value={email}
              autoComplete="email"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label={m.login_password()}>
            <Input
              type="password"
              value={password}
              autoComplete="current-password"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error ? <ErrorText>{error}</ErrorText> : null}
          <Button type="submit" disabled={pending}>
            {m.login_submit()}
          </Button>
        </form>
      ) : null}
      {socials.length > 0 ? (
        <div className="flex flex-col gap-2">
          {socials.map((provider) => (
            <Button key={provider} variant="secondary" onClick={() => social(provider)}>
              {SOCIAL[provider]}
            </Button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-x-4 text-meta">
        <Link
          to="/signup"
          search={{ redirect: search.redirect }}
          className="min-h-11 content-center font-semibold text-point"
        >
          {m.login_signup()}
        </Link>
        {store.loginMethods.includes("password") ? (
          <button
            type="button"
            className="min-h-11 text-sub"
            onClick={() => setResetOpen((open) => !open)}
          >
            {m.login_forgot()}
          </button>
        ) : null}
        <Link to="/guest-order" className="min-h-11 content-center text-sub">
          {m.nav_guest_order()}
        </Link>
      </div>
      {resetOpen ? (
        <div className="flex flex-col gap-2 rounded-card border border-line p-4">
          <p className="text-meta text-sub">{m.login_reset_help()}</p>
          {resetSent ? (
            <p role="status" className="text-meta text-point">
              {m.login_reset_sent()}
            </p>
          ) : (
            <Button variant="secondary" size="sm" disabled={!email} onClick={reset}>
              {m.login_reset_send()}
            </Button>
          )}
        </div>
      ) : null}
    </Container>
  );
}
