import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Checkbox, TextField } from "../components/ui/fields";
import { Container, PageTitle } from "../components/ui/page-title";
import { m } from "../i18n";
import { signup } from "../lib/account-actions";

export const Route = createFileRoute("/signup")({
  validateSearch: z.object({ next: z.string().optional() }),
  head: () => ({ meta: [{ title: m.signup_title() }] }),
  component: SignupPage,
});

function SignupPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "" });
  const [agree, setAgree] = useState({ terms: false, privacy: false, marketing: false });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [key]: e.target.value });
  const required = agree.terms && agree.privacy;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!required) {
      setError(m.signup_agree_required());
      return;
    }
    setPending(true);
    setError(null);
    const result = await signup({ data: { ...form, marketing: agree.marketing } }).catch(
      () => null,
    );
    setPending(false);
    if (result?.ok) {
      queryClient.removeQueries();
      const target = next?.startsWith("/") && !next.startsWith("//") ? next : "/account";
      await navigate({ href: target });
    } else setError(result?.message ?? m.common_error_retry());
  };

  return (
    <Container className="max-w-md">
      <PageTitle>{m.signup_title()}</PageTitle>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label={m.field_email()}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={set("email")}
        />
        <TextField
          label={m.field_password()}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          hint={m.signup_password_hint()}
          value={form.password}
          onChange={set("password")}
        />
        <TextField
          label={m.field_name()}
          name="name"
          autoComplete="name"
          required
          value={form.name}
          onChange={set("name")}
        />
        <TextField
          label={m.field_phone()}
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="01012345678"
          required
          value={form.phone}
          onChange={set("phone")}
        />
        <fieldset className="flex flex-col border-line border-t pt-3">
          <legend className="sr-only">{m.signup_agreements()}</legend>
          <Checkbox
            label={m.signup_agree_all()}
            checked={agree.terms && agree.privacy && agree.marketing}
            onChange={(e) =>
              setAgree({
                terms: e.target.checked,
                privacy: e.target.checked,
                marketing: e.target.checked,
              })
            }
          />
          <Checkbox
            label={
              <>
                {m.signup_agree_terms()}{" "}
                <Link to="/terms" target="_blank" className="text-sub underline">
                  {m.common_view()}
                </Link>
              </>
            }
            checked={agree.terms}
            onChange={(e) => setAgree({ ...agree, terms: e.target.checked })}
          />
          <Checkbox
            label={
              <>
                {m.signup_agree_privacy()}{" "}
                <Link to="/privacy" target="_blank" className="text-sub underline">
                  {m.common_view()}
                </Link>
              </>
            }
            checked={agree.privacy}
            onChange={(e) => setAgree({ ...agree, privacy: e.target.checked })}
          />
          <Checkbox
            label={m.signup_agree_marketing()}
            checked={agree.marketing}
            onChange={(e) => setAgree({ ...agree, marketing: e.target.checked })}
          />
        </fieldset>
        {error ? (
          <p role="alert" className="text-meta text-sale">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {m.signup_submit()}
        </Button>
      </form>
    </Container>
  );
}
