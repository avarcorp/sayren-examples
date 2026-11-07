import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { TextField } from "../components/ui/fields";
import { Container, PageTitle } from "../components/ui/page-title";
import { m } from "../i18n";
import { login, requestPasswordReset } from "../lib/account-actions";

/** 돌아갈 주소는 같은 사이트 안의 경로만 받는다 */
const safeNext = (next: string | undefined) =>
  next?.startsWith("/") && !next.startsWith("//") ? next : "/account";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    next: z.string().optional(),
    passwordReset: z.string().optional(),
  }),
  head: () => ({ meta: [{ title: m.login_title() }] }),
  component: LoginPage,
});

function LoginPage() {
  const { next, passwordReset } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(
    passwordReset === "done" ? m.login_reset_done() : null,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await login({ data: { email, password } }).catch(() => null);
    setPending(false);
    if (result?.ok) {
      queryClient.removeQueries();
      await navigate({ href: safeNext(next) });
    } else setError(result?.message ?? m.common_error_retry());
  };

  return (
    <Container className="max-w-md">
      <PageTitle>{m.login_title()}</PageTitle>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label={m.field_email()}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label={m.field_password()}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? (
          <p role="alert" className="text-meta text-sale">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="text-meta text-sub">
            {notice}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {m.login_submit()}
        </Button>
      </form>
      <button
        type="button"
        className="flex min-h-11 items-center pt-2 text-meta text-sub underline underline-offset-4"
        onClick={async () => {
          if (!email) {
            setError(m.login_reset_need_email());
            return;
          }
          const result = await requestPasswordReset({ data: { email } }).catch(() => null);
          if (result?.ok) {
            setError(null);
            setNotice(m.login_reset_sent());
          } else setError(result?.message ?? m.common_error_retry());
        }}
      >
        {m.login_password_reset()}
      </button>
      <div className="flex flex-col gap-1 pt-6 text-meta">
        <Link
          to="/signup"
          search={{ next }}
          className="flex min-h-11 items-center text-point underline underline-offset-4"
        >
          {m.login_to_signup()}
        </Link>
        <Link
          to="/guest-order"
          className="flex min-h-11 items-center text-sub underline underline-offset-4"
        >
          {m.nav_guest_order()}
        </Link>
      </div>
    </Container>
  );
}
