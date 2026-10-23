import { zodResolver } from "@hookform/resolvers/zod";
import { signupRequestSchema } from "@sayren/storefront-sdk";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../components/atoms/button";
import { Checkbox } from "../components/atoms/checkbox";
import { inputClass } from "../components/atoms/text-input";
import { FormField, fieldAria } from "../components/molecules/form-field";
import { AuthTemplate } from "../components/templates/auth-template";
import { signupFn } from "../lib/auth";
import { redirectSearch } from "../lib/safe-redirect";

/** 가입 입력 — 비밀번호 규칙은 SDK가 원천이다(10자 이상, 영문·숫자·특수문자 중 2종) */
const schema = z.object({
  email: z.string().trim().pipe(z.email("이메일을 다시 확인하십시오")),
  password: signupRequestSchema.shape.password,
  name: z.string().trim().min(1, "이름을 입력하십시오").max(50),
  phone: z
    .string()
    .transform((v) => v.replace(/[^0-9]/g, ""))
    .refine((v) => v === "" || /^01[0-9]{8,9}$/.test(v), "휴대폰 번호를 다시 확인하십시오"),
  terms: z.literal(true, { error: "필수 약관에 동의하십시오" }),
  privacy: z.literal(true, { error: "필수 약관에 동의하십시오" }),
  marketing: z.boolean(),
});
type Input = z.input<typeof schema>;
type Values = z.output<typeof schema>;

export const Route = createFileRoute("/signup")({
  validateSearch: redirectSearch,
  head: () => ({ meta: [{ title: "회원가입 | 설기로운" }] }),
  staticData: { bare: true },
  component: Signup,
});

function Signup() {
  const { redirectTo } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Input, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", name: "", phone: "", marketing: false },
  });
  const { register, formState, watch, setValue } = form;
  const e = formState.errors;
  const all = Boolean(watch("terms") && watch("privacy") && watch("marketing"));

  return (
    <AuthTemplate title="회원가입" showTitle>
      <form
        noValidate
        className="flex flex-col gap-6"
        onSubmit={form.handleSubmit(async (v) => {
          setError(null);
          const r = await signupFn({
            data: {
              email: v.email,
              password: v.password,
              name: v.name,
              phone: v.phone || undefined,
              marketing: v.marketing,
              redirectTo,
            },
          });
          if (r.redirectTo) window.location.assign(r.redirectTo);
          else setError(r.error);
        })}
      >
        <FormField id="su-email" label="이메일" required error={e.email?.message}>
          <input
            {...register("email")}
            {...fieldAria("su-email", e.email?.message)}
            type="email"
            autoComplete="email"
            className={inputClass}
          />
        </FormField>
        <FormField
          id="su-password"
          label="비밀번호"
          required
          error={e.password?.message}
          hint="10자 이상, 영문·숫자·특수문자 중 2가지 이상"
        >
          <input
            {...register("password")}
            {...fieldAria("su-password", e.password?.message, true)}
            type="password"
            autoComplete="new-password"
            className={inputClass}
          />
        </FormField>
        <FormField id="su-name" label="이름" required error={e.name?.message}>
          <input
            {...register("name")}
            {...fieldAria("su-name", e.name?.message)}
            autoComplete="name"
            className={inputClass}
          />
        </FormField>
        <FormField id="su-phone" label="휴대폰 번호" error={e.phone?.message}>
          <input
            {...register("phone")}
            {...fieldAria("su-phone", e.phone?.message)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={inputClass}
          />
        </FormField>
        <fieldset className="flex flex-col border-ink border-t pt-2">
          <legend className="sr-only">약관 동의</legend>
          <Checkbox
            checked={all}
            onChange={(ev) => {
              const on = ev.target.checked;
              setValue("terms", on as true, { shouldValidate: formState.isSubmitted });
              setValue("privacy", on as true, { shouldValidate: formState.isSubmitted });
              setValue("marketing", on);
            }}
            className="border-line border-b font-medium text-body"
          >
            전체 동의
          </Checkbox>
          <Checkbox {...register("terms")} className="text-small">
            [필수] 이용약관 동의
            <Link
              to="/terms"
              target="_blank"
              className="ml-auto text-muted underline underline-offset-2"
            >
              보기
            </Link>
          </Checkbox>
          <Checkbox {...register("privacy")} className="text-small">
            [필수] 개인정보 수집·이용 동의
            <Link
              to="/privacy"
              target="_blank"
              className="ml-auto text-muted underline underline-offset-2"
            >
              보기
            </Link>
          </Checkbox>
          <Checkbox {...register("marketing")} className="text-small">
            [선택] 마케팅 정보 수신 동의
          </Checkbox>
          {e.terms || e.privacy ? (
            <p className="text-primary text-small">필수 약관에 동의하십시오</p>
          ) : null}
        </fieldset>
        <Button type="submit" size="lg" block disabled={formState.isSubmitting}>
          가입하기
        </Button>
        {error ? (
          <p role="alert" className="text-body text-primary">
            {error}
          </p>
        ) : null}
      </form>
      <p className="text-center text-small">
        이미 회원인가요?{" "}
        <Link to="/login" search={{ redirectTo }} className="underline underline-offset-4">
          로그인
        </Link>
      </p>
    </AuthTemplate>
  );
}
