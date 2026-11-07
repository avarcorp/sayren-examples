import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { z } from "zod";
import { Button, Checkbox, ErrorState, PageHeader, TextField } from "../components/ui";
import { useAction } from "../hooks/use-action";
import { m } from "../i18n";
import { signup } from "../lib/auth-actions";

export const Route = createFileRoute("/signup")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: Signup,
});

function Signup() {
  const { redirect } = Route.useSearch();
  const [agree, setAgree] = useState({ terms: false, privacy: false, marketing: false });
  const all = agree.terms && agree.privacy && agree.marketing;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await run(() =>
      signup({
        data: {
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          marketing: agree.marketing,
          redirect,
        },
      }),
    );
    if (result.ok) {
      queryClient.clear();
      await router.navigate({ href: result.data.redirect, replace: true });
    }
  };
  return (
    <main className="mx-auto flex w-full max-w-[26rem] flex-col gap-6">
      <PageHeader title={m.signup_title()} />
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <TextField
          id="signup-name"
          name="name"
          label={m.signup_name()}
          required
          autoComplete="name"
        />
        <TextField
          id="signup-email"
          name="email"
          label={m.login_email()}
          type="email"
          required
          autoComplete="email"
        />
        <TextField
          id="signup-password"
          name="password"
          label={m.login_password()}
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          help={m.signup_password_help()}
        />
        <fieldset className="flex flex-col border-line border-y py-2">
          <legend className="sr-only">{m.signup_agree_all()}</legend>
          <Checkbox
            label={<span className="font-bold">{m.signup_agree_all()}</span>}
            checked={all}
            onChange={(e) =>
              setAgree({
                terms: e.target.checked,
                privacy: e.target.checked,
                marketing: e.target.checked,
              })
            }
          />
          <div className="flex items-center justify-between gap-2">
            <Checkbox
              label={m.signup_agree_terms()}
              required
              checked={agree.terms}
              onChange={(e) => setAgree({ ...agree, terms: e.target.checked })}
            />
            <Link to="/terms" target="_blank" className="shrink-0 text-meta text-sub underline">
              {m.signup_view()}
            </Link>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Checkbox
              label={m.signup_agree_privacy()}
              required
              checked={agree.privacy}
              onChange={(e) => setAgree({ ...agree, privacy: e.target.checked })}
            />
            <Link to="/privacy" target="_blank" className="shrink-0 text-meta text-sub underline">
              {m.signup_view()}
            </Link>
          </div>
          <Checkbox
            label={m.signup_agree_marketing()}
            checked={agree.marketing}
            onChange={(e) => setAgree({ ...agree, marketing: e.target.checked })}
          />
        </fieldset>
        {error ? <ErrorState message={error} /> : null}
        <Button
          type="submit"
          className="w-full"
          disabled={!agree.terms || !agree.privacy || pending}
        >
          {m.signup_submit()}
        </Button>
      </form>
      <Link
        to="/login"
        search={{ redirect }}
        className="inline-flex min-h-11 items-center text-body underline"
      >
        {m.signup_has_account()}
      </Link>
    </main>
  );
}
