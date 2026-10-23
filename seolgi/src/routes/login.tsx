import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "../components/atoms/button";
import { inputClass } from "../components/atoms/text-input";
import { FormField } from "../components/molecules/form-field";
import { SocialButtons } from "../components/molecules/social-buttons";
import { AuthTemplate, DividerText } from "../components/templates/auth-template";
import { passwordLoginFn, type SocialProvider, startSocialFn } from "../lib/auth";

const loginSearch = z.object({
  redirectTo: z.string().max(500).optional().catch(undefined),
  error: z.string().max(50).optional().catch(undefined),
});

const CALLBACK_ERRORS: Record<string, string> = {
  access_denied: "소셜 로그인을 취소했습니다.",
  state_mismatch: "로그인 시간이 지났습니다. 다시 시도하십시오.",
};

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/login")({
  validateSearch: loginSearch,
  head: () => ({ meta: [{ title: "로그인 | 설기로운" }] }),
  staticData: { bare: true },
  component: Login,
});

/** 로그인 (시안 DLogin) — 소셜 버튼, 「이메일로 로그인」, 이메일·비밀번호, 회원가입·비회원 주문 조회 */
function Login() {
  const { redirectTo, error: callbackError } = Route.useSearch();
  const methods = rootRoute.useLoaderData({ select: (d) => d.store?.loginMethods ?? ["password"] });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const social = methods.filter((m): m is SocialProvider => m !== "password");
  const password = methods.includes("password");
  const shown =
    error ??
    (callbackError ? (CALLBACK_ERRORS[callbackError] ?? "소셜 로그인을 마치지 못했습니다.") : null);

  return (
    <AuthTemplate title="로그인">
      <SocialButtons
        providers={social}
        pending={pending}
        onStart={(provider) => {
          setPending(true);
          void startSocialFn({ data: { provider, redirectTo } }).then((r) => {
            // 공급자 로그인 화면은 다른 사이트라 문서째 이동한다
            if (r.url) window.location.assign(r.url);
            else {
              setError(r.error);
              setPending(false);
            }
          });
        }}
      />
      {password ? (
        <>
          {social.length ? <DividerText>이메일로 로그인</DividerText> : null}
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setPending(true);
              void passwordLoginFn({
                data: {
                  email: String(form.get("email") ?? ""),
                  password: String(form.get("password") ?? ""),
                  redirectTo,
                },
              }).then((r) => {
                // 로그인 상태가 모든 화면에 반영되도록 문서째 이동한다
                if (r.redirectTo) window.location.assign(r.redirectTo);
                else {
                  setError(r.error);
                  setPending(false);
                }
              });
            }}
          >
            <FormField id="email" label="이메일" required>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`${inputClass} h-11 text-base`}
              />
            </FormField>
            <FormField id="password" label="비밀번호" required>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`${inputClass} h-11 text-base`}
              />
            </FormField>
            <Button type="submit" size="lg" block disabled={pending}>
              로그인
            </Button>
          </form>
        </>
      ) : null}
      {shown ? (
        <p role="alert" className="-mt-4 text-body text-primary">
          {shown}
        </p>
      ) : null}
      <div className="flex justify-center gap-6 text-small">
        {password ? (
          <>
            <Link to="/signup" search={{ redirectTo }} className="py-3 hover:underline">
              회원가입
            </Link>
            <span aria-hidden className="py-3 text-line-strong">
              |
            </span>
          </>
        ) : null}
        <Link to="/guest-order" className="py-3 hover:underline">
          비회원 주문 조회
        </Link>
      </div>
    </AuthTemplate>
  );
}
