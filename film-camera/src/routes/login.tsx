import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { z } from "zod";
import { Button, ErrorState, PageHeader, TextField } from "../components/ui";
import { useAction } from "../hooks/use-action";
import { useStore } from "../hooks/use-catalog";
import { m } from "../i18n";
import { login, startSocialLogin } from "../lib/auth-actions";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: Login,
});

const SOCIAL_LABEL = {
  kakao: () => m.login_social_kakao(),
  naver: () => m.login_social_naver(),
  google: () => m.login_social_google(),
} as const;

function Login() {
  const store = useStore();
  const { redirect } = Route.useSearch();
  const social = store.loginMethods.filter((method) => method !== "password");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await run(() =>
      login({
        data: {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          redirect,
        },
      }),
    );
    if (result.ok) {
      queryClient.clear();
      await router.navigate({ href: result.data.redirect, replace: true });
    }
  };

  const startSocial = async (provider: "kakao" | "naver" | "google") => {
    const result = await run(() => startSocialLogin({ data: { provider, redirect } }));
    if (result.ok) window.location.assign(result.data.url);
  };
  return (
    <main className="mx-auto flex w-full max-w-[26rem] flex-col gap-6">
      <PageHeader title={m.login_title()} />
      {store.loginMethods.includes("password") ? (
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <TextField
            id="login-email"
            name="email"
            label={m.login_email()}
            type="email"
            required
            autoComplete="email"
          />
          <TextField
            id="login-password"
            name="password"
            label={m.login_password()}
            type="password"
            required
            autoComplete="current-password"
          />
          {error ? <ErrorState message={error} /> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {m.login_submit()}
          </Button>
        </form>
      ) : null}
      {social.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-center text-meta text-muted">{m.login_or()}</p>
          {social.map((method) => (
            <Button
              key={method}
              variant="secondary"
              className="w-full"
              disabled={pending}
              onClick={() => startSocial(method)}
            >
              {SOCIAL_LABEL[method]()}
            </Button>
          ))}
        </div>
      ) : null}
      <div className="flex justify-between gap-4 text-body">
        {store.loginMethods.includes("password") ? (
          <Link
            to="/signup"
            search={{ redirect }}
            className="inline-flex min-h-11 items-center underline"
          >
            {m.login_signup()}
          </Link>
        ) : null}
        <Link to="/guest-order" className="inline-flex min-h-11 items-center text-sub underline">
          {m.login_guest_order()}
        </Link>
      </div>
    </main>
  );
}
