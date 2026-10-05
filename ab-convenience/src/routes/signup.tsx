import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError, signupRequestSchema } from "@sayren/storefront-sdk";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SubmitButton } from "../components/submit-button";
import { TextField } from "../components/text-field";
import { Badge } from "../components/ui/badge";
import { buttonClass, choiceClass } from "../components/ui/button";
import { m } from "../i18n";
import { apiFor, authFor } from "../lib/api.server";
import { clearCartToken, readCartToken } from "../lib/cart-session.server";
import { type SignupForm, type SignupFormInput, signupFormSchema } from "../lib/form-schemas";
import { pageTitle } from "../lib/page-title";
import { safeRedirect } from "../lib/safe-redirect";
import { signIn } from "../lib/session.server";

const signupSearch = z.object({
  redirectTo: z.string().optional().catch(undefined),
});

/**
 * 가입 화면은 이메일·비밀번호 로그인이 켜진 상점에서만 연다. 꺼져 있으면 서버가 403
 * `PASSWORD_LOGIN_DISABLED`로 거절하므로 로그인 화면(소셜 로그인)으로 보낸다.
 */
const getSignupAvailable = createServerFn({ method: "GET" }).handler(async () => {
  const store = await apiFor().store.get();
  if (!store.loginMethods.includes("password")) throw redirect({ to: "/login" });
  return null;
});

/**
 * 가입 — 약관·개인정보 수집이용 동의는 필수이고 마케팅 수신은 선택이다. 서버가 가입과 같은 트랜잭션에서
 * 동의 이력을 남긴다. 비회원으로 담아 둔 장바구니 토큰을 함께 보내면 회원 장바구니로 합쳐지고 그 토큰은 닫힌다.
 */
const signUp = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string(),
      password: z.string(),
      name: z.string(),
      phone: z.string(),
      terms: z.boolean(),
      privacy: z.boolean(),
      marketing: z.boolean(),
      redirectTo: z.unknown(),
    }),
  )
  .handler(async ({ data }) => {
    const cartToken = readCartToken();
    // 입력 규칙(비밀번호 조합·휴대폰 형식)은 SDK 스키마가 원천이다 — 서버에 보내기 전에 같은 규칙으로 안내한다
    const parsed = signupRequestSchema.safeParse({
      email: data.email.trim(),
      password: data.password,
      name: data.name.trim(),
      phone: data.phone.trim() || undefined,
      agreements: { terms: data.terms, privacy: data.privacy, marketing: data.marketing },
      cartToken: cartToken ?? undefined,
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path[0];
      if (field === "agreements")
        return { redirectTo: null, error: m.signup_agreements_required() };
      if (field === "email") return { redirectTo: null, error: m.signup_invalid_email() };
      if (field === "name") return { redirectTo: null, error: m.signup_name_required() };
      return { redirectTo: null, error: issue?.message ?? m.signup_check_input() };
    }
    try {
      signIn(await authFor().signUp(parsed.data));
      if (cartToken) clearCartToken();
      // 어디서 왔는지 모르면 홈으로 간다
      return { redirectTo: safeRedirect(data.redirectTo ?? "/"), error: null };
    } catch (error) {
      return { redirectTo: null, error: signupErrorMessage(error) };
    }
  });

function signupErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "EMAIL_ALREADY_EXISTS") return m.signup_email_exists();
    if (error.code === "PASSWORD_LOGIN_DISABLED") return m.signup_password_disabled();
    if (error.status === 400) return m.signup_check_input();
    if (error.status === 429) return m.signup_rate_limited();
  }
  return m.signup_failed();
}

export const Route = createFileRoute("/signup")({
  validateSearch: signupSearch,
  loader: () => getSignupAvailable(),
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, m.signup_title()) }] }),
  component: Signup,
});

function Signup() {
  const { redirectTo } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const form = useForm<SignupFormInput, unknown, SignupForm>({
    resolver: zodResolver(signupFormSchema),
    // 기본값을 주지 않는다 — 주면 등록할 때 DOM을 덮어 하이드레이션 전에 입력·체크한 값이 사라진다.
    // 체크박스는 DOM에서 boolean으로 읽힌다
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const result = await signUp({
        data: {
          email: values.email,
          password: values.password,
          name: values.name,
          phone: values.phone,
          terms: values.agreements.terms,
          privacy: values.agreements.privacy,
          marketing: values.agreements.marketing,
          redirectTo,
        },
      });
      // 로그인 상태가 모든 화면에 새로 반영되도록 문서째 이동한다. 이동하는 동안 버튼을 다시 열지 않는다
      if (result.redirectTo) {
        setLeaving(true);
        window.location.assign(result.redirectTo);
      } else setError(result.error);
    } catch {
      setError(m.signup_failed());
    }
  });
  const agreementError = errors.agreements?.terms?.message ?? errors.agreements?.privacy?.message;
  // 전체 동의는 세 칸을 한꺼번에 바꾸는 편의 칸이다 — 제출 값은 개별 칸이 정한다
  const [terms, privacy, marketing] = form.watch([
    "agreements.terms",
    "agreements.privacy",
    "agreements.marketing",
  ]);
  const allAgreed = Boolean(terms && privacy && marketing);
  const agreements = [
    { name: "agreements.terms", label: m.signup_agree_terms_label(), required: true },
    { name: "agreements.privacy", label: m.signup_agree_privacy_label(), required: true },
    { name: "agreements.marketing", label: m.signup_agree_marketing_label(), required: false },
  ] as const;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 py-6 md:py-12">
      <h1 className="text-center font-bold text-2xl tracking-tight">{m.signup_title()}</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label={m.signup_email()}
          registration={form.register("email")}
          error={errors.email?.message}
          type="email"
          autoComplete="email"
          required
        />
        <TextField
          label={m.signup_password()}
          registration={form.register("password")}
          error={errors.password?.message}
          type="password"
          autoComplete="new-password"
          required
          hint={m.signup_password_hint()}
        />
        <TextField
          label={m.signup_name()}
          registration={form.register("name")}
          error={errors.name?.message}
          autoComplete="name"
          required
        />
        <TextField
          label={m.signup_phone()}
          registration={form.register("phone")}
          error={errors.phone?.message}
          type="tel"
          autoComplete="tel"
          placeholder="01012345678"
        />

        <fieldset className="mt-2 flex flex-col border border-line">
          <legend className="sr-only">{m.signup_agreements()}</legend>
          <label className="flex items-center gap-2.5 border-line border-b px-4 py-3.5 font-bold text-body-lg">
            <input
              type="checkbox"
              checked={allAgreed}
              onChange={(event) => {
                for (const item of agreements) {
                  form.setValue(item.name, event.target.checked, { shouldValidate: false });
                }
              }}
              className={choiceClass}
            />
            {m.signup_agree_all()}
          </label>
          <div className="flex flex-col gap-3 px-4 py-4">
            {agreements.map((item) => (
              <label key={item.name} className="flex items-center gap-2.5 text-body">
                <input
                  type="checkbox"
                  {...form.register(item.name)}
                  required={item.required}
                  className={choiceClass}
                />
                <Badge tone={item.required ? "outline" : "neutral"}>
                  {item.required ? m.signup_badge_required() : m.signup_badge_optional()}
                </Badge>
                <span className="min-w-0 break-words">{item.label}</span>
              </label>
            ))}
            {agreementError ? <p className="text-caption text-point">{agreementError}</p> : null}
          </div>
        </fieldset>

        <SubmitButton
          disabled={isSubmitting || leaving}
          className={buttonClass({
            variant: "primary",
            size: "lg",
            block: true,
            className: "mt-2",
          })}
        >
          {m.signup_submit()}
        </SubmitButton>
      </form>
      {error ? (
        <p role="alert" className="text-body text-point">
          {error}
        </p>
      ) : null}
      <p className="border-line border-t pt-6 text-center text-meta text-sub">
        {m.signup_already_member()}{" "}
        <Link to="/login" search={{ redirectTo }} className="font-bold text-ink hover:underline">
          {m.signup_login()}
        </Link>
      </p>
    </div>
  );
}
