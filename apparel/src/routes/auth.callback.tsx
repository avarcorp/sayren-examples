import { createFileRoute } from "@tanstack/react-router";
import { ButtonLink } from "../components/ui/button";
import { Container, PageTitle } from "../components/ui/page-title";
import { m } from "../i18n";

/** 소셜 로그인 복귀 — 켜진 소셜 로그인이 있을 때 결과를 받아 로그인을 마친다(SDK 연결 단계) */
export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  return (
    <Container className="max-w-md">
      <PageTitle>{m.callback_title()}</PageTitle>
      <p role="status" className="pb-6 text-body text-sub">
        {m.callback_detail()}
      </p>
      <ButtonLink to="/login" variant="secondary">
        {m.login_title()}
      </ButtonLink>
    </Container>
  );
}
