import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button, Container, ErrorText, Field, Input, PageTitle } from "../components/ui";
import { m } from "../i18n";
import { sessionQuery } from "../lib/account-queries";
import { signup } from "../lib/auth-actions";

/** 회원가입 — 이용약관·개인정보 필수 동의, 마케팅 선택 동의. 비회원 장바구니를 넘겨 합친다 */
export const Route = createFileRoute("/signup")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: async ({ context }) => {
    const member = await context.queryClient.ensureQueryData(sessionQuery());
    if (member) throw redirect({ to: "/account" });
  },
  component: SignupPage,
});

function SignupPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!terms || !privacy) return setError(m.signup_agree_needed());
    if (form.password.length < 8) return setError(m.signup_password_short());
    setPending(true);
    const result = await signup({ data: { ...form, marketing, redirect: search.redirect } });
    setPending(false);
    if (!result.ok) return setError(result.message);
    await queryClient.invalidateQueries();
    await navigate({ to: result.data.redirect });
  };

  const check = "flex min-h-11 items-center gap-2 text-meta";
  return (
    <Container className="flex max-w-md flex-col gap-6 pt-8">
      <PageTitle>{m.signup_title()}</PageTitle>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <Field label={m.signup_name()}>
          <Input
            value={form.name}
            autoComplete="name"
            required
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label={m.login_email()}>
          <Input
            type="email"
            value={form.email}
            autoComplete="email"
            required
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label={m.login_password()} hint={m.signup_password_hint()}>
          <Input
            type="password"
            value={form.password}
            autoComplete="new-password"
            required
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <div className="flex flex-col border-line border-t pt-2">
          <label className={check}>
            <input
              type="checkbox"
              className="size-4 accent-point"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
            />
            <span>
              {m.signup_terms()}{" "}
              <Link to="/terms" className="text-point underline">
                {m.signup_view()}
              </Link>
            </span>
          </label>
          <label className={check}>
            <input
              type="checkbox"
              className="size-4 accent-point"
              checked={privacy}
              onChange={(e) => setPrivacy(e.target.checked)}
            />
            <span>
              {m.signup_privacy()}{" "}
              <Link to="/privacy" className="text-point underline">
                {m.signup_view()}
              </Link>
            </span>
          </label>
          <label className={check}>
            <input
              type="checkbox"
              className="size-4 accent-point"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
            />
            <span>{m.signup_marketing()}</span>
          </label>
        </div>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button type="submit" disabled={pending}>
          {m.signup_submit()}
        </Button>
      </form>
    </Container>
  );
}
