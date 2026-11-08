import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Container, LinkButton, PageTitle } from "../../components/ui";
import { m } from "../../i18n";
import { finishSocialLogin } from "../../lib/auth-actions";

/** 소셜 로그인 복귀 — 서버 함수가 공급자 결과로 토큰을 받고 쿠키에 둔다 */
export const Route = createFileRoute("/auth/callback")({
  validateSearch: z.object({
    code: z.string().optional(),
    state: z.string().optional(),
    error: z.string().optional(),
  }),
  preload: false,
  component: AuthCallback,
});

function AuthCallback() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    finishSocialLogin({
      data: { code: search.code ?? null, state: search.state ?? null, error: search.error ?? null },
    })
      .then(async (result) => {
        if (!result.ok) return setFailed(true);
        await queryClient.invalidateQueries();
        await navigate({ to: result.redirect, replace: true });
      })
      .catch(() => setFailed(true));
  }, [search, navigate, queryClient]);
  return (
    <Container className="flex flex-col gap-4 pt-12">
      <PageTitle>{failed ? m.callback_failed() : m.callback_checking()}</PageTitle>
      {failed ? (
        <LinkButton to="/login" variant="secondary" className="w-fit">
          {m.nav_login()}
        </LinkButton>
      ) : null}
    </Container>
  );
}
