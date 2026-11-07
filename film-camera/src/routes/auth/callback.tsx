import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { ButtonLink, ErrorState, PageHeader } from "../../components/ui";
import { m } from "../../i18n";
import { finishSocialLogin } from "../../lib/auth-actions";

/**
 * 소셜 로그인 복귀 — 서버가 인가 코드와 보관한 state·codeVerifier로 토큰을 받아 세션에 담고 원래 화면으로 보낸다.
 * `code`는 한 번만 쓸 수 있어 미리 받기(preload)에서 부르지 않는다
 */
export const Route = createFileRoute("/auth/callback")({
  validateSearch: z.object({
    code: z.string().optional(),
    state: z.string().optional(),
    error: z.string().optional(),
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps, preload }) => {
    if (preload) return { failed: false };
    const result = await finishSocialLogin({
      data: { code: deps.code ?? null, state: deps.state ?? null, error: deps.error ?? null },
    });
    if (result.ok) throw redirect({ href: result.redirect, replace: true });
    return { failed: true };
  },
  component: Callback,
});

function Callback() {
  const { failed } = Route.useLoaderData();
  return (
    <main className="flex flex-col gap-4">
      <PageHeader title={failed ? m.callback_failed() : m.callback_title()} />
      {failed ? (
        <ErrorState
          message={m.callback_failed()}
          action={
            <ButtonLink to="/login" variant="secondary">
              {m.callback_retry()}
            </ButtonLink>
          }
        />
      ) : (
        <p role="status" className="text-body-lg text-sub">
          {m.callback_body()}
        </p>
      )}
    </main>
  );
}
